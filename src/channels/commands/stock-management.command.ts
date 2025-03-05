import { 
    SlashCommandBuilder, 
    CommandInteraction,
    StringSelectMenuBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageFlags
} from 'discord.js';
import { logger } from '../../config/logger';
import { ChannelService } from '../services/channels-service';

export const data = new SlashCommandBuilder()
    .setName('stock-management-form')
    .setDescription('Display the stock management form');

export async function execute(interaction: CommandInteraction) {
    try {
        // Création de l'embed
        const embed = new EmbedBuilder()
            .setTitle('🏫 Gestion de la catégorie stock')
            .setDescription('Utilisez ce formulaire pour gérer le stock de channels de Simplon HdF.')
            .addFields(
                { name: 'Instructions', value: '1. Utilisez les boutons ci-dessous pour gérer le stock de channels.\n2. Les modifications sont immédiates et irréversibles.' }
            )
            .setColor('#FF0000')
            .setFooter({ text: 'Bot de gestion du stock • v1.0' });

        // Création des boutons
        const createButton = new ButtonBuilder()
            .setCustomId('show-create-channel')
            .setLabel('Créer un channel')
            .setStyle(ButtonStyle.Success)
            .setEmoji('➕');

        const modifyButton = new ButtonBuilder()
            .setCustomId('show-modify-channel')
            .setLabel('Modifier un channel')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✏️');

        const deleteButton = new ButtonBuilder()
            .setCustomId('show-delete-channel')
            .setLabel('Supprimer un channel')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🗑️');

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(createButton, modifyButton, deleteButton);

        // Envoi du message avec l'embed et les boutons
        await interaction.reply({
            embeds: [embed],
            components: [row]
        });

        logger.info({
            user: interaction.user.tag
        }, 'Formulaire de gestion de la catégorie stock affiché');
    } catch (error) {
        logger.error(error, 'Erreur lors de l\'affichage du formulaire de gestion de la catégorie stock');
        await interaction.reply({
            content: '❌ Une erreur est survenue lors de l\'affichage du formulaire.',
            flags: MessageFlags.Ephemeral
        });
    }
} 