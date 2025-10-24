import { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase with service role for bot operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

// Role configuration
const ROLES = {
  basic: process.env.ROLE_BASIC,
  pro: process.env.ROLE_PRO,
  premium: process.env.ROLE_PREMIUM,
};

const GUILD_ID = process.env.DISCORD_GUILD_ID;

// Commands
const commands = [
  {
    name: 'link',
    description: 'Link your Discord account to your Ovara account',
  },
  {
    name: 'sync',
    description: 'Sync your subscription roles',
  },
  {
    name: 'unlink',
    description: 'Unlink your Discord account from your Ovara account',
  },
  {
    name: 'status',
    description: 'Check your account linking and subscription status',
  },
];

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

// Get user's subscription tier from Supabase
async function getUserTier(userId) {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user tier:', error);
      return null;
    }

    return data?.tier || 'basic';
  } catch (error) {
    console.error('Error in getUserTier:', error);
    return null;
  }
}

// Get Discord link for user
async function getDiscordLink(userId) {
  try {
    const { data, error } = await supabase
      .from('discord_links')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching Discord link:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getDiscordLink:', error);
    return null;
  }
}

// Get Discord link by Discord ID
async function getDiscordLinkByDiscordId(discordId) {
  try {
    const { data, error } = await supabase
      .from('discord_links')
      .select('*')
      .eq('discord_id', discordId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Discord link:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getDiscordLinkByDiscordId:', error);
    return null;
  }
}

// Sync roles for a user
async function syncUserRoles(member, tier) {
  try {
    console.log(`\n🔄 Starting role sync for ${member.user.tag}`);
    console.log(`   Target tier: ${tier}`);
    console.log(`   Current roles: ${member.roles.cache.map(r => r.name).join(', ')}`);
    console.log(`   Role IDs configured:`, ROLES);

    // Check if bot has permission to manage roles
    const botMember = await member.guild.members.fetchMe();
    if (!botMember.permissions.has('ManageRoles')) {
      console.error('❌ Bot does not have "Manage Roles" permission');
      return false;
    }
    console.log('✅ Bot has "Manage Roles" permission');

    // Remove all subscription roles first
    const rolesToRemove = Object.values(ROLES).filter(roleId =>
      member.roles.cache.has(roleId)
    );

    console.log(`   Roles to remove: ${rolesToRemove.length}`);
    for (const roleId of rolesToRemove) {
      try {
        const role = await member.guild.roles.fetch(roleId);
        console.log(`   Removing role: ${role.name} (${roleId})`);
        await member.roles.remove(roleId);
        console.log(`   ✅ Removed role: ${role.name}`);
      } catch (err) {
        console.error(`   ❌ Failed to remove role ${roleId}:`, err.message);
      }
    }

    // Add the appropriate role based on tier
    const roleId = ROLES[tier.toLowerCase()];
    if (!roleId) {
      console.error(`❌ No role ID configured for tier: ${tier}`);
      return false;
    }

    try {
      const role = await member.guild.roles.fetch(roleId);
      if (!role) {
        console.error(`❌ Role not found: ${roleId}`);
        return false;
      }

      // Check if bot role is higher than target role
      const botHighestRole = botMember.roles.highest;
      console.log(`   Bot's highest role: ${botHighestRole.name} (position: ${botHighestRole.position})`);
      console.log(`   Target role: ${role.name} (position: ${role.position})`);

      if (botHighestRole.position <= role.position) {
        console.error(`❌ Bot role "${botHighestRole.name}" is not higher than "${role.name}"`);
        console.error(`   Bot needs to be positioned ABOVE the subscription roles in Server Settings → Roles`);
        return false;
      }

      console.log(`   Adding role: ${role.name} (${roleId})`);
      await member.roles.add(roleId);
      console.log(`✅ Successfully assigned ${tier} role to ${member.user.tag}`);
      return true;
    } catch (err) {
      console.error(`❌ Failed to add role ${roleId}:`, err.message);
      console.error(`   Full error:`, err);
      return false;
    }
  } catch (error) {
    console.error('❌ Error syncing roles:', error);
    return false;
  }
}

// Automatic role sync for all linked users
async function autoSyncAllUsers() {
  try {
    console.log('🔄 Running automatic role sync for all users...');

    // Get all Discord links
    const { data: links, error } = await supabase
      .from('discord_links')
      .select('*');

    if (error) {
      console.error('Error fetching discord links:', error);
      return;
    }

    if (!links || links.length === 0) {
      console.log('   No linked users to sync');
      return;
    }

    console.log(`   Found ${links.length} linked user(s) to check`);

    const guild = await client.guilds.fetch(GUILD_ID);
    let syncedCount = 0;
    let errorCount = 0;

    for (const link of links) {
      try {
        // Get user's current tier
        const tier = await getUserTier(link.user_id);
        if (!tier) {
          console.log(`   ⚠️  No tier found for user ${link.user_email}`);
          continue;
        }

        // Get member from guild
        const member = await guild.members.fetch(link.discord_id).catch(() => null);
        if (!member) {
          console.log(`   ⚠️  User ${link.discord_username} not in server`);
          continue;
        }

        // Check if they already have the correct role
        const currentTierRole = ROLES[tier.toLowerCase()];
        if (member.roles.cache.has(currentTierRole)) {
          // Already has correct role, skip
          continue;
        }

        // Sync roles
        const success = await syncUserRoles(member, tier);
        if (success) {
          syncedCount++;
          console.log(`   ✅ Auto-synced ${member.user.tag} to ${tier}`);
        } else {
          errorCount++;
        }
      } catch (err) {
        console.error(`   ❌ Error syncing user ${link.discord_username}:`, err.message);
        errorCount++;
      }
    }

    if (syncedCount > 0 || errorCount > 0) {
      console.log(`✅ Auto-sync complete: ${syncedCount} synced, ${errorCount} errors`);
    } else {
      console.log('✅ Auto-sync complete: All roles already up to date');
    }
  } catch (error) {
    console.error('❌ Error in autoSyncAllUsers:', error);
  }
}

// Bot ready event
client.once('ready', async () => {
  console.log(`✅ Discord bot logged in as ${client.user.tag}`);
  await registerCommands();

  // Set bot status
  client.user.setActivity('Ovara subscriptions', { type: 'WATCHING' });

  // Send welcome message to roles channel (if ROLES_CHANNEL_ID is set)
  if (process.env.ROLES_CHANNEL_ID) {
    await sendRolesChannelWelcome();
  }

  // Start automatic role sync every 30 seconds
  console.log('🔄 Starting automatic role sync (every 30 seconds)...');
  setInterval(autoSyncAllUsers, 30000); // 30 seconds

  // Run initial sync after 5 seconds
  setTimeout(autoSyncAllUsers, 5000);
});

// Function to send welcome message to roles channel
async function sendRolesChannelWelcome() {
  try {
    const channel = await client.channels.fetch(process.env.ROLES_CHANNEL_ID);
    if (!channel) {
      console.log('Roles channel not found');
      return;
    }

    // Delete previous messages from the bot in this channel (optional - keeps it clean)
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessages = messages.filter(m => m.author.id === client.user.id);
    if (botMessages.size > 0) {
      await channel.bulkDelete(botMessages);
    }

    const embed = new EmbedBuilder()
      .setColor('#6366F1')
      .setTitle('🎭 Get Your Subscription Roles!')
      .setDescription(
        'Welcome to Ovara! Link your Discord account to your Ovara subscription to get automatic role assignment.\n\n' +
        '**Your role will match your subscription tier:**\n' +
        '💚 **Basic** - Access to basic features\n' +
        '💙 **Pro** - All Basic features + advanced tools\n' +
        '💜 **Premium** - Full access to everything\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━'
      )
      .addFields(
        {
          name: '📝 How to Get Your Role',
          value:
            '**1.** Type `/link` in any channel\n' +
            '**2.** You\'ll receive an 8-character code\n' +
            '**3.** Go to [Ovara Website](https://ovara.app) and log in\n' +
            '**4.** Navigate to **Settings → Discord Integration**\n' +
            '**5.** Enter your code and click **Link Account**\n' +
            '**6.** Come back here and type `/sync`\n' +
            '**7.** ✅ You\'re all set! Your role will be assigned automatically',
          inline: false
        },
        {
          name: '🤖 Available Commands',
          value:
            '`/link` - Get your linking code\n' +
            '`/sync` - Update your roles based on subscription\n' +
            '`/status` - Check your account status\n' +
            '`/unlink` - Disconnect your Discord account',
          inline: false
        },
        {
          name: '❓ Need Help?',
          value:
            '• Codes expire in **10 minutes**\n' +
            '• Make sure you\'re logged into the correct Ovara account\n' +
            '• Your role updates automatically when your subscription changes\n' +
            '• Use `/sync` to manually refresh your roles',
          inline: false
        }
      )
      .setFooter({
        text: 'Ovara Discord Integration • Your subscription, your access',
        iconURL: client.user.displayAvatarURL()
      })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log('✅ Sent welcome message to roles channel');
  } catch (error) {
    console.error('Error sending roles channel welcome:', error);
  }
}

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'link') {
    // Generate a unique linking code
    const linkCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Store the linking code temporarily (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    try {
      // Store linking code in database
      const { error } = await supabase
        .from('discord_link_codes')
        .insert({
          code: linkCode,
          discord_id: interaction.user.id,
          discord_username: interaction.user.tag,
          expires_at: expiresAt,
        });

      if (error) throw error;

      const embed = new EmbedBuilder()
        .setColor('#6366F1')
        .setTitle('🔗 Link Your Discord Account')
        .setDescription(
          `To link your Discord account with your Ovara account:\n\n` +
          `1. Go to the Ovara website and log in\n` +
          `2. Navigate to Settings → Discord Integration\n` +
          `3. Enter this code:\n\n` +
          `**\`${linkCode}\`**\n\n` +
          `⏱️ This code expires in 10 minutes.`
        )
        .setFooter({ text: 'Ovara Discord Integration' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error creating link code:', error);
      await interaction.reply({
        content: '❌ Failed to generate linking code. Please try again.',
        ephemeral: true,
      });
    }
  }

  if (commandName === 'sync') {
    await interaction.deferReply({ ephemeral: true });

    try {
      // Check if user is linked
      const link = await getDiscordLinkByDiscordId(interaction.user.id);

      if (!link) {
        await interaction.editReply({
          content: '❌ Your Discord account is not linked to an Ovara account. Use `/link` to get started.',
        });
        return;
      }

      // Get user's tier
      const tier = await getUserTier(link.user_id);

      if (!tier) {
        await interaction.editReply({
          content: '❌ Could not fetch your subscription tier. Please try again.',
        });
        return;
      }

      // Sync roles
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const success = await syncUserRoles(member, tier);

      if (success) {
        await interaction.editReply({
          content: `✅ Successfully synced your roles! You now have the **${tier.toUpperCase()}** tier.`,
        });
      } else {
        await interaction.editReply({
          content: '❌ Failed to sync roles. Please contact support.',
        });
      }
    } catch (error) {
      console.error('Error syncing roles:', error);
      await interaction.editReply({
        content: '❌ An error occurred while syncing roles. Please try again.',
      });
    }
  }

  if (commandName === 'unlink') {
    try {
      const link = await getDiscordLinkByDiscordId(interaction.user.id);

      if (!link) {
        await interaction.reply({
          content: '❌ Your Discord account is not currently linked.',
          ephemeral: true,
        });
        return;
      }

      // Remove the link
      const { error } = await supabase
        .from('discord_links')
        .delete()
        .eq('discord_id', interaction.user.id);

      if (error) throw error;

      // Remove all subscription roles
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const rolesToRemove = Object.values(ROLES).filter(roleId =>
        member.roles.cache.has(roleId)
      );

      for (const roleId of rolesToRemove) {
        await member.roles.remove(roleId);
      }

      await interaction.reply({
        content: '✅ Successfully unlinked your Discord account and removed subscription roles.',
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error unlinking account:', error);
      await interaction.reply({
        content: '❌ Failed to unlink account. Please try again.',
        ephemeral: true,
      });
    }
  }

  if (commandName === 'status') {
    await interaction.deferReply({ ephemeral: true });

    try {
      const link = await getDiscordLinkByDiscordId(interaction.user.id);

      if (!link) {
        await interaction.editReply({
          content: '❌ Your Discord account is not linked to an Ovara account.\n\nUse `/link` to get started!',
        });
        return;
      }

      const tier = await getUserTier(link.user_id);

      const embed = new EmbedBuilder()
        .setColor('#6366F1')
        .setTitle('📊 Account Status')
        .addFields(
          { name: '🔗 Linked', value: '✅ Yes', inline: true },
          { name: '📧 Email', value: link.user_email || 'Unknown', inline: true },
          { name: '💎 Subscription', value: tier ? tier.toUpperCase() : 'Unknown', inline: true },
          { name: '📅 Linked Since', value: new Date(link.created_at).toLocaleDateString(), inline: true }
        )
        .setFooter({ text: 'Ovara Discord Integration' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching status:', error);
      await interaction.editReply({
        content: '❌ Failed to fetch status. Please try again.',
      });
    }
  }
});

// Handle new member joins
client.on('guildMemberAdd', async member => {
  try {
    const link = await getDiscordLinkByDiscordId(member.id);

    if (link) {
      // User is already linked, sync their roles
      const tier = await getUserTier(link.user_id);
      if (tier) {
        await syncUserRoles(member, tier);
        console.log(`Auto-synced roles for returning member: ${member.user.tag}`);
      }
    } else {
      // Send welcome DM with linking instructions
      const embed = new EmbedBuilder()
        .setColor('#6366F1')
        .setTitle('👋 Welcome to Ovara!')
        .setDescription(
          `Thanks for joining the Ovara Discord server!\n\n` +
          `To get access to subscriber-only channels and features, link your Discord account to your Ovara account:\n\n` +
          `Use the \`/link\` command in the server to get started.`
        )
        .setFooter({ text: 'Ovara Discord Integration' });

      try {
        await member.send({ embeds: [embed] });
      } catch (error) {
        console.log(`Could not send DM to ${member.user.tag}`);
      }
    }
  } catch (error) {
    console.error('Error handling new member:', error);
  }
});

// Initialize Express server for OAuth callbacks
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', bot: client.user?.tag || 'offline' });
});

// Webhook endpoint for subscription changes
app.post('/webhook/subscription-updated', async (req, res) => {
  try {
    const { user_id, old_tier, new_tier, discord_id } = req.body;

    console.log(`📢 Webhook: Subscription changed for user ${user_id}: ${old_tier} → ${new_tier}`);

    if (!discord_id) {
      console.log('No Discord ID provided, skipping role sync');
      return res.json({ success: true, message: 'No Discord account linked' });
    }

    // Get guild and member
    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(discord_id).catch(() => null);

    if (!member) {
      console.log(`Member ${discord_id} not found in guild`);
      return res.json({ success: false, message: 'Member not in server' });
    }

    // Sync roles based on new tier
    const success = await syncUserRoles(member, new_tier);

    if (success) {
      console.log(`✅ Auto-synced roles for ${member.user.tag}: ${old_tier} → ${new_tier}`);

      // Send DM to user about the change
      try {
        const embed = new EmbedBuilder()
          .setColor(new_tier === 'premium' ? '#A855F7' : new_tier === 'pro' ? '#6366F1' : '#10B981')
          .setTitle('🎉 Subscription Updated!')
          .setDescription(
            `Your Ovara subscription has been updated!\n\n` +
            `**Old Plan:** ${old_tier.charAt(0).toUpperCase() + old_tier.slice(1)}\n` +
            `**New Plan:** ${new_tier.charAt(0).toUpperCase() + new_tier.slice(1)}\n\n` +
            `Your Discord roles have been automatically updated to match your new subscription tier.`
          )
          .setFooter({ text: 'Ovara Discord Integration' })
          .setTimestamp();

        await member.send({ embeds: [embed] });
      } catch (error) {
        console.log('Could not send DM to user:', error.message);
      }

      return res.json({ success: true, message: 'Roles synced successfully' });
    } else {
      return res.json({ success: false, message: 'Failed to sync roles' });
    }
  } catch (error) {
    console.error('Error in subscription webhook:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Start the bot
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('Failed to login:', err);
  process.exit(1);
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await client.destroy();
  process.exit(0);
});
