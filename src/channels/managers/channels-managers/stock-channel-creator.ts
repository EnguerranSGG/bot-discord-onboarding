import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} from "discord.js";
import { logger } from "../../../config/logger";
import { ChannelService } from "../../services/channels-service";

export class StockChannelCreator {
  private channelService: ChannelService;

  constructor(channelService: ChannelService) {
    this.channelService = channelService;
  }

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
}
