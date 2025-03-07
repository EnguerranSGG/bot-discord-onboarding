import {
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  Client,
  Guild,
  MessageFlags
} from "discord.js";
import { logger } from "../../config/logger";
import { ChannelService } from "../services/channels-service";
import { StockChannelCreator } from "../managers/channels-managers/stock-channel-creator";
import { StockChannelModifier } from "../managers/channels-managers/stock-channel-modifier";
import { StockChannelDeleter } from "../managers/channels-managers/stock-channel-deleter";

export class StockManagementHandler {
  private channelService: ChannelService;
  private stockChannelCreator: StockChannelCreator;
  private stockChannelModifier: StockChannelModifier;
  private stockChannelDeleter: StockChannelDeleter;

  constructor(client: Client, guild: Guild) {
    this.channelService = new ChannelService(client, guild);
    this.stockChannelCreator = new StockChannelCreator(this.channelService);
    this.stockChannelModifier = new StockChannelModifier(this.channelService);
    this.stockChannelDeleter = new StockChannelDeleter(this.channelService);
  }

  /**
   * Gère les interactions des boutons du formulaire de gestion.
   */
  async handleButtonInteraction(interaction: ButtonInteraction) {
    try {
      switch (interaction.customId) {
        case "show-create-channel":
          await this.stockChannelCreator.showCreateChannelModal(interaction);
          break;
        case "show-modify-channel":
          await this.stockChannelModifier.showModifyChannelSelection(
            interaction
          );
          break;
        case "show-delete-channel":
          await this.stockChannelDeleter.showDeleteChannelSelection(
            interaction
          );
          break;
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
        await this.stockChannelCreator.handleCreateStockPost(interaction);
        return;
      }
      if (interaction.customId.startsWith("update-stock-post-")) {
        logger.info(
          `✅ Interaction de mise à jour détectée : ${interaction.customId}`
        );
        await this.stockChannelModifier.handleModifyModalSubmit(interaction);
        return;
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === "select-stock-channel-update") {
        logger.info(
          `✅ Channel sélectionné pour modification : ${interaction.values[0]}`
        );
        await this.stockChannelModifier.handleSelectMenu(interaction);
        return;
      }
      if (interaction.customId === "select-stock-channel-delete") {
        await this.stockChannelDeleter.handleDeleteChannelSelection(
          interaction
        );
        return;
      }
    }
    logger.warn(
      `Interaction non gérée dans StockManagementHandler : ${interaction.customId}`
    );
  }
}
