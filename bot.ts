import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import axios from 'axios';
import { db } from './src/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc, limit } from 'firebase/firestore';

dotenv.config();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ] 
});

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Tracking state to prevent duplicate notifications
const lastRaidMap = new Map();

client.once('clientReady', () => {
    console.log(`[Bot] Logged in as ${client.user?.tag}!`);
    console.log(`[Bot] Intelligence gathering sequence initiated...`);
    
    // Start background tracking loop (every 60 seconds)
    setInterval(trackRaids, 60000);
});

async function trackRaids() {
    try {
        const usersRef = collection(db, 'users');
        // Test connectivity gracefully
        try {
            await getDocs(query(usersRef, where('arcTrackerKey', '!=', ''), limit(1)));
        } catch (connError: any) {
            if (connError.code === 'not-found') {
                console.log('[Bot] Users collection not initialized yet.');
                return;
            }
            throw connError;
        }

        const q = query(usersRef, where('arcTrackerKey', '!=', ''));
        const querySnapshot = await getDocs(q);

        for (const userDoc of querySnapshot.docs) {
            const userData = userDoc.data();
            const discordId = userDoc.id;
            const arcKey = userData.arcTrackerKey;
            
            if (!arcKey) continue;

            const response = await axios.get(`${APP_URL}/api/rounds`, {
                headers: { 'x-user-key': arcKey }
            }).catch(() => null);

            if (!response || !response.data) continue;

            const rounds = response.data.data || response.data.rounds || [];
            if (rounds.length === 0) continue;

            const latestRaid = rounds[0];
            const raidId = latestRaid.id || latestRaid.timestamp;
            
            // Check if this is a new raid we haven't reported yet
            if (lastRaidMap.get(discordId) !== raidId) {
                lastRaidMap.set(discordId, raidId);

                // Find a channel to notify (or use a stored preference)
                const channelId = userData.notificationChannelId;
                if (!channelId) continue;

                const channel = await client.channels.fetch(channelId).catch(() => null);
                if (channel && channel.isTextBased()) {
                    await sendRaidNotification(channel as any, latestRaid, userData);
                }
            }
        }
    } catch (error: any) {
        if (error.code === 'not-found') {
            console.log('[Bot] No users collection/users with keys yet. Skipping poll (normal for new DB).');
            return;
        }
        console.error('[Bot] Tracking loop error:', error.message || error);
    }
}

async function sendRaidNotification(channel: any, raid: any, user: any) {
    const isSuccess = raid.outcome === 'extracted' || raid.outcome === 'SUCCESS';
    const profit = raid.netValue || raid.rdValue || 0;
    const loot = raid.items || raid.loot || [];
    const topLoot = loot.filter((i: any) => i.rarity === 'Legendary' || i.rarity === 'Epic').map((i: any) => i.name).join(', ');
    
    const embed = new EmbedBuilder()
        .setTitle(`🛑 RAID REPORT: ${raid.mapName || raid.map || 'UNKNOWN SECTOR'}`)
        .setDescription(`Operative **${user.username || 'Unknown'}** has returned from the surface.`)
        .setColor(isSuccess ? 0x39FF14 : 0xFF073A)
        .addFields(
            { name: 'Outcome', value: isSuccess ? '✅ EXTRACTED' : '❌ ELIMINATED', inline: true },
            { name: 'Profit/Loss', value: `**$${profit.toLocaleString()}**`, inline: true },
            { name: 'Kills (ARC/Raider)', value: `${raid.botKills || 0} / ${raid.playerKills || 0}`, inline: true }
        );

    if (topLoot) {
        embed.addFields({ name: 'High-Value Assets Recovered', value: `\`${topLoot}\`` });
    }

    embed.setThumbnail(`https://cdn.metaforge.app/arc-raiders/maps/${(raid.mapName || raid.map || '').toLowerCase().replace(/ /g, '-')}.webp`)
        .setTimestamp()
        .setFooter({ text: 'SHiESTY Tactical Intel', iconURL: client.user?.displayAvatarURL() });

    await channel.send({ embeds: [embed] });
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!shiesty help') {
        const helpEmbed = new EmbedBuilder()
            .setTitle('🛡️ SHiESTY COMMAND INTERRUPT')
            .setColor(0x39FF14)
            .setDescription('Tactical Discord commands for the Raider Codex.')
            .addFields(
                { name: '!ping', value: 'Check orbital uplink status.' },
                { name: '!setlogs', value: 'Set current channel for RAID NOTIFICATIONS.' },
                { name: '!market', value: 'View trending high-value listings.' }
            );
        message.reply({ embeds: [helpEmbed] });
    }

    if (message.content === '!setlogs') {
        const userDocRef = doc(db, 'users', message.author.id);
        await setDoc(userDocRef, { notificationChannelId: message.channelId }, { merge: true });
        message.reply(`📡 **UPLINK ESTABLISHED.** Raid reports for <@${message.author.id}> will be broadcast here.`);
    }

    if (message.content === '!ping') {
        message.reply('🥷 **SHiESTY STATUS: NOMINAL.** Orbital uplink active.');
    }
    
    if (message.content === '!market') {
        try {
            const storeRes = await axios.get(`${APP_URL}/api/public-store`);
            const trader = storeRes.data?.trader || 'Anonymous';
            const listings = storeRes.data?.inventory || [];
            
            // Highlight valuable items or blueprints
            const featured = listings
                .filter((i: any) => i.name.includes('Blueprint') || i.rarity === 'Legendary' || i.rarity === 'Epic' || i.rarity === 'rarity-epic')
                .slice(0, 5);
            
            if (featured.length === 0 && listings.length > 0) {
                featured.push(...listings.slice(0, 5));
            }
            
            const marketEmbed = new EmbedBuilder()
                .setTitle('⚖️ SHiESTY TRADING POST')
                .setColor(0xFFB800)
                .setDescription(`Latest high-value supply synced from **${trader}**'s Stash.`);
            
            if (featured.length === 0) {
                marketEmbed.addFields({ name: 'Inventory Empty', value: 'No items currently in stock.' });
            } else {
                featured.forEach((item: any) => {
                    const rarityClean = (item.rarity || 'Common').replace('rarity-', '').toUpperCase();
                    marketEmbed.addFields({ 
                        name: `${item.name} (x${item.quantity})`, 
                        value: `Rarity: **${rarityClean}**`,
                        inline: false 
                    });
                });
            }

            message.reply({ embeds: [marketEmbed] });
        } catch (e: any) {
            console.error('[Bot Market Error]', e.message);
            message.reply('⚠️ Marketplace data stream corrupted or offline.');
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
