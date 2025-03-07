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
  MessageFlags,
  ChannelType,
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
      logger.error(
        "Erreur lors de la gestion des boutons du stock-management-form",
        error
      );
      await interaction.reply({
        content: "❌ Une erreur est survenue.",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
  async showModifyChannelSelection(interaction: ButtonInteraction) {
    logger.info(`🔍 DEBUG: Début de showModifyChannelSelection`);

    // Assurer que la guild est bien récupérée
    if (!interaction.guild) {
      logger.error("❌ Impossible de récupérer la guild depuis l'interaction.");
      return interaction.reply({
        content: "❌ Erreur : impossible de récupérer la guild.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const channels = await this.channelService.getStockChannels();

    // Convertir en tableau au cas où
    const channelsArray = Array.isArray(channels)
      ? channels
      : Array.from(channels.values()).filter((c) => c !== null);

    logger.info(
      `🔍 Channels récupérés : ${JSON.stringify(
        channelsArray.map((c) => c!.name)
      )}`
    );

    if (!channelsArray.length) {
      logger.error("❌ Aucun channel trouvé pour modification.");
      return interaction.reply({
        content: "❌ Aucun channel trouvé.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("select-stock-channel-update")
      .setPlaceholder("Sélectionne un channel")
      .addOptions(
        channelsArray.map((channel) => ({
          label: channel!.name,
          value: channel!.id,
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu
    );

    logger.info(`✅ Menu de sélection créé.`);

    await interaction.reply({
      content: "✏️ Sélectionne un channel à modifier :",
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
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
  async getStockChannels(guild: Guild | null) {
    logger.info(`🔍 Début de getStockChannels()`);

    if (!guild) {
      logger.error("❌ La guild est introuvable.");
      return [];
    }

    try {
      const guildChannels = await guild.channels.fetch();
      logger.info(
        `🔍 Nombre total de channels récupérés : ${guildChannels?.size}`
      );

      if (!guildChannels) {
        throw new Error("❌ Impossible de récupérer les channels du serveur.");
      }

      logger.info(`🔍 STOCK_ID défini ? ${process.env.STOCK_ID}`);

      if (!process.env.STOCK_ID) {
        throw new Error("❌ STOCK_ID est undefined !");
      }

      const channels = guildChannels.filter(
        (channel) =>
          channel?.parentId === process.env.STOCK_ID &&
          (channel!.type === ChannelType!.GuildText ||
            channel!.type === ChannelType.GuildVoice)
      );

      logger.info(
        `✅ Channels filtrés (${channels.size} trouvés) : ${JSON.stringify(
          channels.map((c) => c!.name)
        )}`
      );

      return channels;
    } catch (error) {
      logger.error("❌ Erreur dans getStockChannels() :", error);
      return [];
    }
  }

  async handleSelectMenu(interaction: StringSelectMenuInteraction) {
    logger.info(
      `🔍 DEBUG: Début de handleSelectMenu → Interaction ID: ${interaction.customId}`
    );

    if (interaction.customId !== "select-stock-channel-update") {
      logger.warn(`⚠️ Interaction ignorée : ${interaction.customId}`);
      return;
    }

    const channelId = interaction.values[0];
    logger.info(`🔍 Channel sélectionné pour modification : ${channelId}`);

    const modal = new ModalBuilder()
      .setCustomId(`update-stock-post-${channelId}`)
      .setTitle("Modifier le channel");

    const nameInput = new TextInputBuilder()
      .setCustomId("name")
      .setLabel("Nouveau nom du channel")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const positionInput = new TextInputBuilder()
      .setCustomId("position")
      .setLabel("Nouvelle position")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(positionInput)
    );

    await interaction.showModal(modal);
    logger.info(`✅ Modal de modification affiché.`);
  }

  async handleModifyModalSubmit(interaction: ModalSubmitInteraction) {
    logger.info(
      `🔍 DEBUG: Début de handleModalSubmit → Interaction ID: ${interaction.customId}`
    );

    if (!interaction.customId.startsWith("update-stock-post-")) {
      logger.warn(`⚠️ Interaction ignorée : ${interaction.customId}`);
      return;
    }

    const channelId = interaction.customId.replace("update-stock-post-", "");
    logger.info(`🔍 Mise à jour du channel ${channelId}`);

    const newName = interaction.fields.getTextInputValue("name");
    const newPosition = interaction.fields.getTextInputValue("position");

    logger.info(
      `🔍 Nouveaux paramètres → Nom: ${newName || "inchangé"}, Position: ${
        newPosition || "inchangée"
      }`
    );

    const guild = interaction.guild;
    if (!guild) {
      logger.error("❌ Impossible de récupérer la guild.");
      await interaction.reply({
        content: "❌ Erreur : impossible de récupérer la guild.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = await guild.channels.fetch(channelId);
    if (!channel) {
      logger.error(`❌ Channel non trouvé avec l'ID ${channelId}`);
      await interaction.reply({
        content: "❌ Channel introuvable.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    logger.info(`✅ Channel trouvé : ${channel.name}`);

    // Mise à jour du channel sur Discord
    const updatedChannel = await channel.edit({
      name: newName || channel.name,
      position: newPosition
        ? parseInt(newPosition)
        : "position" in channel
        ? channel.position
        : undefined,
    });

    logger.info(
      `✅ Channel mis à jour sur Discord → Nom: ${
        updatedChannel.name
      }, Position: ${
        "position" in updatedChannel ? updatedChannel.position : "inchangée"
      }`
    );

    logger.info(`📡 Envoi de la requête API pour la mise à jour du channel : ${channelId}`);
logger.info(`📡 Données envoyées : ${JSON.stringify({
    name: newName || undefined,
    channelPosition: newPosition ? parseInt(newPosition) : undefined,
})}`);


    try {
      logger.info(
        `🔍 Appel à updateDiscordChannel pour le channel ${channelId}`
      );
      await this.channelService.updateDiscordChannel(channelId, {
        name: newName || undefined,
        channelPosition: newPosition ? parseInt(newPosition) : undefined,
      });

      logger.info(
        `✅ Mise à jour en base réussie pour le channel ${updatedChannel.name}`
      );
    } catch (error) {
      logger.error(
        `❌ Erreur lors de la mise à jour du channel en base :`,
        error
      );
    }

    await interaction.reply({
      content: `✅ Channel "${updatedChannel.name}" mis à jour avec succès !`,
      flags: MessageFlags.Ephemeral,
    });
  }

  /**
   * Gère la soumission du formulaire de création de channel.
   */
  async handleCreateStockPost(interaction: ModalSubmitInteraction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const name = interaction.fields.getTextInputValue("name");
      const type = interaction.fields.getTextInputValue("type");
      const position = parseInt(
        interaction.fields.getTextInputValue("position")
      );

      logger.info(
        `📥 Création du channel : name=${name}, type=${type}, position=${position}`
      );

      if (type !== "text" && type !== "voice") {
        await interaction.editReply({
          content: "❌ Le type doit être 'text' ou 'voice'.",
        });
        return;
      }

      if (isNaN(position) || position < 0) {
        await interaction.editReply({
          content: "❌ La position doit être un nombre positif.",
        });
        return;
      }

      const newChannel = await this.channelService.createDiscordChannel(
        name,
        type,
        position
      );
      logger.info(`✅ Channel créé : ${newChannel.id}`);

      await interaction.editReply({
        content: `✅ Channel "${name}" créé avec succès !`,
      });
    } catch (error) {
      logger.error("❌ Erreur lors de la création du channel :", error);
      if (!interaction.replied) {
        await interaction.editReply({
          content: "❌ Une erreur est survenue lors de la création du channel.",
        });
      }
    }
  }

  /**
   * Gère l'interaction principale pour le stock-management-form.
   */
  async handleInteraction(
    interaction:
      | ButtonInteraction
      | StringSelectMenuInteraction
      | ModalSubmitInteraction
  ) {
    if (interaction.isButton()) {
      await this.handleButtonInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === "create-stock-post") {
        await this.handleCreateStockPost(interaction);
        return;
      }
      if (interaction.customId.startsWith("update-stock-post-")) {
        logger.info(
          `✅ Interaction de mise à jour détectée : ${interaction.customId}`
        );
        await this.handleModifyModalSubmit(interaction);
        return;
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "select-stock-channel-update") {
        logger.info(
          `✅ Channel sélectionné pour modification : ${interaction.values[0]}`
        );
        await this.handleSelectMenu(interaction);
        return;
      }
    }
    logger.warn(
      `Interaction non gérée dans StockManagementHandler : ${interaction.customId}`
    );
  }
}
