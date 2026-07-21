const { Collection, ChatInputCommandInteraction } = require("discord.js");
const config = require("@root/config");

const cooldowns = {};

class Functions {
    /**
     * Check if the command is in cooldown
     * @param {string} userId
     * @param {import("@base/command")} cmd
     * @returns {false | {seconds: number}}
     */
    static isInCooldown(userId, cmd) {
        let userCooldown = cooldowns[userId];
        const currentTime = Date.now();

        if (!userCooldown) {
            cooldowns[userId] = {};
            userCooldown = cooldowns[userId];
        }

        const cooldown = userCooldown[cmd.infos.name] || 0;
        const seconds = Math.ceil((cooldown - currentTime) / 1000);

        if (cooldown > currentTime) {
            return {
                seconds
            };
        }

        userCooldown[cmd.infos.name] = currentTime + cmd.config.cooldown;

        setTimeout(() => {
            delete userCooldown[cmd.infos.name];
            if (Object.keys(userCooldown).length === 0) {
                delete cooldowns[userId];
            }
        }, cmd.config.cooldown);

        return false;
    }

    /**
     * Get all commands by category
     * @param {ChatInputCommandInteraction} interaction
     * @param {Collection<string, import("@base/command")>} commands
     * @param {string} category
     * @returns {Array<{name: string, value: string}>}
     */
    static getCommands(interaction, commands, category) {
        return commands
            .filter(cmd => cmd.infos.category === category)
            .map(cmd => {
                if (cmd.config.restricted && !config.guilds.some(guild => guild === interaction.guildId)) return null;

                const NAME =
                    interaction.t(`${cmd.infos.category}/${cmd.infos.name}:NAME`) !== "NAME"
                        ? interaction.t(`${cmd.infos.category}/${cmd.infos.name}:NAME`)
                        : cmd.infos.name;
                const DESC =
                    interaction.t(`${cmd.infos.category}/${cmd.infos.name}:DESCRIPTION`) !== "DESCRIPTION"
                        ? interaction.t(`${cmd.infos.category}/${cmd.infos.name}:DESCRIPTION`)
                        : cmd.infos.description;

                return {
                    name: cmd.config.enabled ? `/${NAME}` : interaction.t("general/help:DISABLED", { NAME }),
                    value: DESC
                };
            })
            .filter(cmd => cmd !== null);
    }

    /**
     * Get the start date of the week
     * @returns {Date}
     */
    static getStartOfWeek() {
        const date = new Date();
        const day = date.getDay();
        const difference = day === 0 ? 6 : day - 1;
        date.setDate(date.getDate() - difference);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    /**
     * Get the end date of the week
     * @returns {Date}
     */
    static getEndOfWeek() {
        const endOfWeek = new Date();
        const day = endOfWeek.getDay();
        const diff = 7 - day;
        endOfWeek.setDate(endOfWeek.getDate() + diff);
        endOfWeek.setHours(23, 59, 59, 999);
        return endOfWeek;
    }

    /**
     * Parse time string into timestamp (ex: 1mo 1w 1d 1h)
     * @param {string} time
     * @returns {number}
     */
    static parseTime(time) {
        const now = Date.now();
        const date = Date.parse(time);

        if (!isNaN(date)) return date - now;

        const args = time.split(" ");
        const timeUnits = [
            { factor: 1, suffix: "s" },
            { factor: 60, suffix: "m" },
            { factor: 3600, suffix: "h" },
            { factor: 86400, suffix: "d" },
            { factor: 604800, suffix: "w" },
            { factor: 2592000, suffix: "mo" },
            { factor: 31104000, suffix: "y" }
        ];
        let timestamp = 0;

        args.forEach(part => {
            const value = parseInt(part.slice(0, -1), 10);
            const unit = timeUnits.find(unit => part.endsWith(unit.suffix));
            if (unit && value) {
                timestamp += value * unit.factor * 1000;
            }
        });

        return timestamp;
    }

    /**
     * Convert image content to base64 from an url
     * @param {string} url
     * @returns {Promise<string>}
     */
    static async ImageToBase64(url) {
        const imageUrlData = await fetch(url);
        const buffer = await imageUrlData.arrayBuffer();
        return Buffer.from(buffer).toString("base64");
    }

    /**
     * Capitalize the string
     * @param {string} string
     * @returns {string}
     */
    static Capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Mention a user/channel/role in a message
     * @param {string} id
     * @param {"channel" | "user" | "role"} type
     * @returns {string}
     */
    static Mention(id, type) {
        const types = { channel: "#", user: "@", role: "@&" };
        return `<${types[type] || ""}${id}>`;
    }
}

module.exports = Functions;
