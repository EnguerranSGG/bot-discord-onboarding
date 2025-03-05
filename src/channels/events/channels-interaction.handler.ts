import { 
    ButtonInteraction, 
    ModalSubmitInteraction,
    StringSelectMenuInteraction,
    StringSelectMenuBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder, 
    Client, 
    Guild, 
    MessageFlags
} from "discord.js";
import { logger } from "../../config/logger";
import { ChannelService } from "../services/channels-service";

export class StockManagementHandler {
    private channelService: ChannelService;

    constructor(client: Client, guild: Guild) {
        this.channelService = new ChannelService(client, guild);
    }

    /**
     * Gère les interactions des boutons du formulaire de gestion.
     */
    async handleButtonInteraction(interaction: ButtonInteraction) {
        try {
            switch (interaction.customId) {
                case "show-create-channel":
                    await this.showCreateChannelModal(interaction);
                    break;
                case "show-modify-channel":
                    await this.showModifyChannelSelection(interaction);
                    break;
                /*case "show-delete-channel":
                    await this.showDeleteChannelSelection(interaction);
                    break;*/
                default:
                    logger.warn(`Bouton non géré : ${interaction.customId}`);
            }
        } catch (error) {
            logger.error("Erreur lors de la gestion des boutons du stock-management-form", error);
            await interaction.reply({ content: "❌ Une erreur est survenue.", flags: MessageFlags.Ephemeral });
        }
    }

    /**
     * Affiche le modal de création de channel.
     */
    async showCreateChannelModal(interaction: ButtonInteraction) {
        const modal = new ModalBuilder()
            .setCustomId("create-stock-post")
            .setTitle("Créer un nouveau channel");

        const nameInput = new TextInputBuilder()
            .setCustomId("name")
            .setLabel("Nom du channel")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const typeChoice = new TextInputBuilder()
            .setCustomId("type")
            .setLabel("Type (text/voice)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const positionInput = new TextInputBuilder()
            .setCustomId("position")
            .setLabel("Position")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(typeChoice),
            new ActionRowBuilder<TextInputBuilder>().addComponents(positionInput)
        );

        await interaction.showModal(modal);
    }

    /**
     * Affiche un menu déroulant pour sélectionner un channel à modifier.
     */
    async showModifyChannelSelection(interaction: ButtonInteraction) {
        const channels = await this.channelService.getStockChannels();
        if (!channels.length) {
            return interaction.reply({ content: "❌ Aucun channel trouvé.", flags: MessageFlags.Ephemeral });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("select-stock-channel-update")
            .setPlaceholder("Sélectionne un channel")
            .addOptions(
                channels.map(channel => ({ label: channel.name, value: channel.id }))
            );

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
        await interaction.reply({ content: "✏️ Sélectionne un channel à modifier :", components: [row], flags: MessageFlags.Ephemeral });
    }

    /**
     * Gère la soumission du formulaire de création de channel.
     */
    async handleCreateStockPost(interaction: ModalSubmitInteraction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const name = interaction.fields.getTextInputValue("name");
            const type = interaction.fields.getTextInputValue("type");
            const position = parseInt(interaction.fields.getTextInputValue("position"));

            logger.info(`📥 Création du channel : name=${name}, type=${type}, position=${position}`);

            if (type !== "text" && type !== "voice") {
                await interaction.editReply({ content: "❌ Le type doit être 'text' ou 'voice'." });
                return;
            }

            if (isNaN(position) || position < 0) {
                await interaction.editReply({ content: "❌ La position doit être un nombre positif." });
                return;
            }

            const newChannel = await this.channelService.createDiscordChannel(name, type, position);
            logger.info(`✅ Channel créé : ${newChannel.id}`);

            await interaction.editReply({ content: `✅ Channel "${name}" créé avec succès !` });
        } catch (error) {
            logger.error("❌ Erreur lors de la création du channel :", error);
            if (!interaction.replied) {
                await interaction.editReply({ content: "❌ Une erreur est survenue lors de la création du channel." });
            }
        }
    }

    /**
     * Gère l'interaction principale pour le stock-management-form.
     */
    async handleInteraction(interaction: ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction) {
        if (interaction.isButton()) {
            await this.handleButtonInteraction(interaction);
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === "create-stock-post") {
                await this.handleCreateStockPost(interaction);
                return;
            }
            logger.warn(`Interaction non gérée dans StockManagementHandler : ${interaction.customId}`);
        }
    }
}
