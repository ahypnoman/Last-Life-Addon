import { world } from '@minecraft/server'
import { system } from '@minecraft/server'
import * as mc from '@minecraft/server'
import * as ui from '@minecraft/server-ui'

//defs

let options = {
    bm: "",
    sessionbm: "",
    bmMode: "punish",
    revives: true,
    players: {},
    session: 0,
    randomRange: [2, 6],
    randomlife: false,
    initialized: false
}

let logs = [[]]

function getRandom(min, max) {
    return Math.round(Math.random() * (max - min) + min)
}

function initBM(bm) {
    system.run(() => {
        logs[logs.length - 1].push({ type: "Pick Boogeyman", location: Object.values(bm.location).map(x => Math.floor(x)).join(", "), user: "§cPlayer private§7", time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: "§cNo message" })
        save()
        options.bm = bm.name
        options.sessionbm = bm.name
        save()
        world.getPlayers({ gameMode: "survival" }).forEach(p => {
            p.onScreenDisplay.setTitle("§eYou are...")
            system.runTimeout(() => {
                if (options.bm === p.name) {
                    p.onScreenDisplay.setTitle("§cThe Boogeyman.")
                    if (options.bmMode === "reward") {
                        p.sendMessage("§7You are the Boogeyman. You have been granted the right to kill a §agreen §7or §eyellow §7name. If you succeed you will be granted 1 life. All loyalties and friendships are removed while you are the boogeyman.")
                    } else if (options.bmMode === "punish") {
                        p.sendMessage("§7You are the Boogeyman. You must by any means necessary kill a §agreen §7or §eyellow §7name to be cured of the curse. If you fail, next session you will become a §cred name§7. All loyalties and friendships are removed while you are the boogeyman.")
                    } else if (options.bmMode === "combined") {
                        p.sendMessage("§7You are the Boogeyman. You must by any means necessary kill a §agreen §7or §eyellow §7name to be cured of the curse. If you fail, next session you will become a §cred name§7. If you succeed you will be granted 1 life. All loyalties and friendships are removed while you are the boogeyman.")
                    }
                    options.bmValidator = Math.random().toString(36).slice(2, 6)
                    save()
                    p.sendMessage("")
                    p.sendMessage("§c§lWARNING:")
                    p.sendMessage("§7If your boogeyman kill is done using a trap or otherwise indirectly you must inform a server operator using this code: §r" + options.bmValidator)
                } else {
                    p.onScreenDisplay.setTitle("§aNot the Boogeyman")
                }
            }, 120)
        })
    })
}

function cure(nolife, bmDead) {
    const bm = world.getPlayers({ name: options.bm })[0]
    if (bm) {
        logs[logs.length - 1].push({ type: "Succeed boogeyman cure", location: Object.values(bm.location).map(x => Math.floor(x)).join(", "), user: bm.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: "Boogeyman cured" })
        save()
        if ((options.bmMode === "reward" || options.bmMode === "combined") && !nolife) {
            options.players[bm.name].lives++
            const lives = options.players[bm.name].lives
            bm.sendMessage("§7You have been granted 1 life. You now have " + (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2")) + lives + " §7lives.")
            world.playSound("item.trident.thunder", { ...bm.location })
            for (let i = 0; i < 5; i++) bm.dimension.spawnParticle("minecraft:totem_particle", { ...bm.location }, new mc.MolangVariableMap())
            bm.nameTag = (lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + bm.name
            logs[logs.length - 1].push({ type: "Boogeyman gain life", location: Object.values(bm.location).map(x => Math.floor(x)).join(", "), user: bm.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: "Now on " + lives })
            save()
        }

        if (bmDead) {
            world.sendMessage("§cThe boogeyman is dead.")
            world.sendMessage("§c" + bm.name + "§7 was the Boogeyman")
            logs[logs.length - 1].push({ type: "Boogeyman fully dead", location: Object.values(bm.location).map(x => Math.floor(x)).join(", "), user: bm.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: "Boogeyman dead" })
            save()
        } else {
            const lives = options.players[bm.name].lives
            bm.onScreenDisplay.setTitle("§aYou are cured!")
            world.sendMessage("§aThe Boogeyman has been cured!")
            world.sendMessage((lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + bm.name + "§7 was the Boogeyman")
        }
    }
    options.bm = ""
    save()
}

const commands = {
    "boogeyman": {
        adminOnly: true,
        script: (player, args) => {
            logs[logs.length - 1].push({ type: "Admin Command: boogeyman", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: args.join(" ") })
            save()
            system.run(() => {
                const players = world.getPlayers({ gameMode: "survival" })
                initBM(args[0] ? world.getPlayers({ name: args[0] })[0] : players[Math.floor(Math.random() * players.length)])
            })
        }
    },
    "info": {
        adminOnly: false,
        script: (player, args) => {
            logs[logs.length - 1].push({ type: "Boogeyman request info", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: "§cNo message" })
            save()
            system.run(() => {
                if (player.name === options.bm) {
                    if (options.bmMode === "reward") {
                        player.sendMessage("§7You are the Boogeyman. You have been granted the right to kill a §agreen §7or §eyellow §7name. If you succeed you will be granted 1 life. All loyalties and friendships are removed while you are the boogeyman.")
                    } else if (options.bmMode === "punish") {
                        player.sendMessage("§7You are the Boogeyman. You must by any means necessary kill a §agreen §7or §eyellow §7name to be cured of the curse. If you fail, next session you will become a §cred name§7. All loyalties and friendships are removed while you are the boogeyman.")
                    } else if (options.bmMode === "combined") {
                        player.sendMessage("§7You are the Boogeyman. You must by any means necessary kill a §agreen §7or §eyellow §7name to be cured of the curse. If you fail, next session you will become a §cred name§7. If you succeed you will be granted 1 life. All loyalties and friendships are removed while you are the boogeyman.")
                    }
                    player.sendMessage("")
                    player.sendMessage("§c§lWARNING:")
                    player.sendMessage("§7If your boogeyman kill is done using a trap or otherwise indirectly you must inform a server operator using this code: §r" + Math.random().toString(36).slice(2, 6))
                } else {
                    player.sendMessage("§cError: Only the Boogeyman can use that command.")
                }
            })
        }
    },
    "help": {
        adminOnly: false,
        script: (player) => {
            logs[logs.length - 1].push({ type: "Player request help", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: "§cNo message" })
            save()
            player.sendMessage(" ")
            player.sendMessage("§lObjectives:")
            player.sendMessage(" ")
            player.sendMessage("    §l§aGreen §r§land §eyellow §r§l§lobjective:")
            player.sendMessage("    Survive.")
            player.sendMessage(" ")
            player.sendMessage("    §l§cRed §r§lobjective:")
            player.sendMessage("    Survive. Can also kill other players.")
            player.sendMessage(" ")
            player.sendMessage("    §l§cBoogeyman §r§lobjective:")
            player.sendMessage("    Kill another player.")
            player.sendMessage(" ")
            player.sendMessage("§lCommands")
            player.sendMessage(" ")
            player.sendMessage("    §lGeneral commands")
            player.sendMessage("    @help - explains how the game works.")
            player.sendMessage("    @lives - lists life counts of players")
            player.sendMessage("    @givelife <username> - gives one of your lives to spefified player")
            player.sendMessage("    @sessionlogs <item?> - gets the logs for the session with id of item. If item is not provided it return a list of available logs.")
            player.sendMessage(" ")
            player.sendMessage("    §l§cBoogeyman §r§lcommands")
            player.sendMessage("    @info - explains the Boogeyman's objective in more detail.")
            player.sendMessage(" ")
            player.sendMessage("    §lAdmin commands")
            player.sendMessage("    @boogeyman <Boogeyman username?> - Starts the game. Specifying a username will set that player as a Boogeyman")
            player.sendMessage("    @options <help | ...> - allows game rules to be set. Use \"@options help\" for a list of options")
            player.sendMessage("    @cure <code?> - cures the Boogeyman. Optional validation code.")
            player.sendMessage("    @session - starts a new session.")
            player.sendMessage(" ")
            player.sendMessage("§l§cBoogeyman §r§lmodes:")
            player.sendMessage(" ")
            player.sendMessage("    §lReward:")
            player.sendMessage("    Grants the Boogeyman an extra life upon killing another player.")
            player.sendMessage(" ")
            player.sendMessage("    §lPunish:")
            player.sendMessage("    The Boogeyman becomes a §cred name §rif they fail to kill another player.")
            player.sendMessage(" ")
            player.sendMessage("    §lCombined:")
            player.sendMessage("    Both other modes combined.")
            player.sendMessage(" ")

        }
    },
    "options": {
        adminOnly: true,
        script: (player, args) => {
            logs[logs.length - 1].push({ type: "Admin Command: options", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: args.join(" ") })
            save()
            system.run(() => {
                if (args[0] === "help") {
                    player.sendMessage("help - provides list of options commands.")
                    player.sendMessage("player <username> lives get - gets player lives")
                    player.sendMessage("player <username> lives set <quantity> - sets player lives")
                    player.sendMessage("bmmode get - gets the current boogeyman behaviour mode")
                    player.sendMessage("bmmode set <reward|punish|combined> - sets the current boogeyman behaviour mode")
                    player.sendMessage("revivemode get - gets the status of the revivemode gamerule")
                    player.sendMessage("revivemode set <true|false> - sets the revivemode gamrule")
                    player.sendMessage("randomlife get - gets the status of the randomlife gamerule")
                    player.sendMessage("randomlife set <true|false> - sets the randomlife gamrule")
                    player.sendMessage("session get - gets the session number")
                    player.sendMessage("session set <integer> - sets the session number")
                    player.sendMessage("liferange get - gets the random life selection range")
                    player.sendMessage("liferange set <min|max> <integer> - sets min or max in the random life selection range")
                } else if (args[0] === "bmmode") {
                    if (args[1] === "set") {
                        if (["reward", "punish", "combined"].includes(args[2])) {
                            options.bmMode = args[2]
                            save()
                            player.sendMessage("Done")
                        }
                        else player.sendMessage("§cInvalid argument: >>" + args[2] + "<< - expected \"reward\", \"punish\", or \"combined\"")
                    } else if (args[1] === "get") {
                        player.sendMessage(options.bmMode)
                    } else {
                        player.sendMessage("§cInvalid argument: >>" + args[1] + "<< expected \"set\", or \"get\"")
                    }
                } else if (args[0] === "player") {
                    if (Object.keys(options.players).includes(args[1])) {
                        if (args[2] === "lives") {
                            if (args[3] === "set") {
                                if (parseInt(args[4]) > -1 && Number.isInteger(parseFloat(args[4]))) {
                                    options.players[args[1]].lives = args[4]
                                    save()
                                    const lives = args[4]
                                    player.sendMessage("Done")
                                    world.getPlayers({ name: args[1] })[0].sendMessage("§7Your lives have been set by an administrator. You now have " + (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2")) + lives + " §7lives.")
                                    logs[logs.length - 1].push({ type: "Admin give life", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: args[1] + " is now on " + lives })
                                    save()
                                }
                                else player.sendMessage("§cInvalid argument: >>" + args[4] + "<< - expected integer greater than -1")
                            } else if (args[3] === "get") {
                                player.sendMessage(options.players[args[1]].lives)
                            } else {
                                player.sendMessage("§cInvalid argument: >>" + args[3] + "<< expected \"set\", or \"get\"")
                            }
                        } else player.sendMessage("§cInvalid argument: >>" + args[2] + "<< - expected \"lives\"")
                    } else {
                        player.sendMessage("§cInvalid argument: >>" + args[1] + "<< expected player to exist")
                    }
                } else if (args[0] === "liferange") {
                    if (args[1] === "set") {
                        if (args[2] === "min") {

                            if (parseInt(args[3]) > 0 && Number.isInteger(parseFloat(args[3]))) {
                                options.randomRange[0] = parseInt(args[3])
                                save()
                                player.sendMessage("Done")
                            }
                            else player.sendMessage("§cInvalid argument: >>" + args[3] + "<< - expected integer greater than 0")
                        } else if (args[2] === "max") {
                            if (parseInt(args[3]) > 0 && Number.isInteger(parseFloat(args[3]))) {
                                options.randomRange[1] = parseInt(args[3])
                                save()
                                player.sendMessage("Done")
                            }
                            else player.sendMessage("§cInvalid argument: >>" + args[3] + "<< - expected integer greater than 0")
                        } else player.sendMessage("§cInvalid argument: >>" + args[2] + "<< - expected \"min\" or \"max\"")

                    } else if (args[1] === "get") {
                        player.sendMessage(JSON.stringify(options.randomRange))
                    } else {
                        player.sendMessage("§cInvalid argument: >>" + args[1] + "<< expected \"set\" or \"get\"")
                    }
                } else if (args[0] === "session") {
                    if (args[1] === "set") {
                        if (parseInt(args[2]) > -1 && Number.isInteger(parseFloat(args[2]))) {
                            options.session = parseInt(args[2])
                            save()
                            player.sendMessage("Done")
                        } else player.sendMessage("§cInvalid argument: >>" + args[2] + "<< - expected integer greater than -1")
                    } else if (args[1] === "get") {
                        player.sendMessage(options.session.toString())
                    } else {
                        player.sendMessage("§cInvalid argument: >>" + args[1] + "<< expected \"set\", or \"get\"")
                    }
                } else if (args[0] === "revivemode") {
                    if (args[1] === "set") {
                        if (["true", "false"].includes(args[2])) {
                            options.revives = JSON.parse(args[2])
                            save()
                            player.sendMessage("Done")
                        }
                        else player.sendMessage("§cInvalid argument: >>" + args[2] + "<< - expected \"true\" or \"false\"")
                    } else if (args[1] === "get") {
                        player.sendMessage(options.revives.toString())
                    } else {
                        player.sendMessage("§cInvalid argument: >>" + args[1] + "<< expected \"set\", or \"get\"")
                    }
                } else if (args[0] === "randomlifemode") {
                    if (args[1] === "set") {
                        if (["true", "false"].includes(args[2])) {
                            options.randomlife = JSON.parse(args[2])
                            save()
                            player.sendMessage("Done")
                        }
                        else player.sendMessage("§cInvalid argument: >>" + args[2] + "<< - expected \"true\" or \"false\"")
                    } else if (args[1] === "get") {
                        player.sendMessage(options.randomlife.toString())
                    } else {
                        player.sendMessage("§cInvalid argument: >>" + args[1] + "<< expected \"set\", or \"get\"")
                    }
                } else {
                    player.sendMessage("§cInvalid argument: >>" + args[0] + "<< expected valid options item")
                }
            })
        }
    },
    "cure": {
        adminOnly: true,
        script: (player, args) => {
            logs[logs.length - 1].push({ type: "Admin Command: cure", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: args.join(" ") })
            save()
            system.run(() => {
                if (args[0]) {
                    if (args[0] === "*") {
                        player.sendMessage("Curing Boogeyman")
                        cure(true)
                    } else if (options.bmValidator === args[0]) {
                        player.sendMessage("Curing Boogeyman")
                        cure()
                    } else {
                        player.sendMessage("§cInvalid Boogeyman code")
                    }
                }
                else {
                    cure()
                    player.sendMessage("Curing Boogeyman")
                }
            })

        }
    },
    "lives": {
        adminOnly: false,
        script: (player, args) => {
            logs[logs.length - 1].push({ type: "Player request life count", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: "§cNo message" })
            save()
            system.run(() => {
                player.sendMessage("§9§lPlayer lives:")
                for (const i in options.players) {
                    const lives = options.players[i].lives
                    const prefix = (lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2")))
                    player.sendMessage(prefix + lives + "§7 - " + prefix + (player.name === i ? "§l" : "") + i)
                }
            })

        }
    },
    "givelife": {
        adminOnly: false,
        script: (player, args) => {
            logs[logs.length - 1].push({ type: "Attempt life transfer", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: "Transfer to " + args[0] + "." })
            save()
            system.run(() => {
                if (Object.keys(options.players).includes(args[0])) {
                    let lives = options.players[args[0]].lives
                    if (lives > 0 || options.revives) {
                        if (options.players[player.name].lives > 0) {
                            const target = world.getPlayers({ name: args[0] })[0]
                            if (lives <= 0) {
                                target.teleport({ ...player.location }, { dimension: player.dimension })
                                target.dimension.runCommand("gamemode survival " + target.name)
                                for (let i = 0; i < 5; i++) target.dimension.spawnParticle("minecraft:totem_particle", { ...target.location }, new mc.MolangVariableMap())
                                world.getAllPlayers().forEach(p => {
                                    p.playSound("item.trident.thunder")
                                })
                                target.onScreenDisplay.setTitle("§aYou have been revived")
                            } else world.playSound("item.trident.thunder", { ...target.location })
                            if (options.players[player.name].lives === 1) {
                                player.kill()
                            } else {
                                options.players[player.name].lives--
                            }
                            options.players[args[0]].lives++
                            lives++
                            target.nameTag = (lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + target.name
                            player.sendMessage("§7You have given a life to " + (lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + args[0] + "§7. You now have " + (options.players[player.name].lives < 2 ? "§c" : (options.players[player.name].lives === 2 ? "§e" : (options.players[player.name].lives === 3 ? "§a" : "§2"))) + options.players[player.name].lives + "§7 " + (options.players[player.name].lives === 1 ? "life. " : "lives. ") + args[0] + " now has " + (lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + lives + "§7 " + (lives === 1 ? "life. " : "lives. "))
                            player.nameTag = (options.players[player.name].lives < 2 ? "§c" : (options.players[player.name].lives === 2 ? "§e" : (options.players[player.name].lives === 3 ? "§a" : "§2"))) + player.name
                            target.sendMessage("§7You have been granted 1 life by " + player.nameTag + "§7. You now have " + (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2")) + lives + " §7lives.")
                            for (let i = 0; i < 5; i++) target.dimension.spawnParticle("minecraft:totem_particle", { ...target.location }, new mc.MolangVariableMap())
                            world.getPlayers({ excludeNames: [player.name, target.name] }).forEach(p => {
                                p.sendMessage(player.nameTag + "§7 has granted " + target.nameTag + "§7 1 life.")
                            })
                            logs[logs.length - 1].push({ type: "Succeed life transfer", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: args[0] + " is now on " + options.players[args[0]].lives + " - " + player.name + " is now on " + options.players[player.name].lives })
                            save()
                        } else {
                            player.sendMessage("§cOnly living players can transfer lives")
                        }
                    } else {
                        player.sendMessage("§cPlayer must not be dead to transfer lives")
                    }
                } else {
                    player.sendMessage("§cUnknown player: \"" + args[0] + "\"")
                }
            })

        }
    },
    "session": {
        adminOnly: true,
        script: (player, args) => {
            logs[logs.length - 1].push({ type: "New session", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: ("session: " + (options.session)) + (options.sessionbm !== "" ? (", boogeyman: " + options.sessionbm) : "") })
            logs.push([])
            save()
            system.run(() => {
                options.session++
                if (options.session === 1) {
                    world.sendMessage("§7Randomizing lives in 1 minute")
                    system.runTimeout(() => {
                        system.runTimeout(() => {
                            randomizeLives()
                        })
                    }, 1200)
                } else {
                    if (options.randomlife) {
                        world.sendMessage("§7Assigning random life in 1 minute")
                        system.runTimeout(() => {
                            system.runTimeout(() => {
                                const target = world.getPlayers({ gameMode: "survival" })[getRandom(0, world.getPlayers({ gameMode: "survival" }).length - 1)]
                                logs[logs.length - 1].push({ type: "Grant random life", location: Object.values(target.location).map(x => Math.floor(x)).join(", "), user: target.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: target.name + " is now on " + (options.players[target.name].lives + 1) })
                                save()
                                options.players[target.name].lives++
                                const lives = options.players[target.name].lives
                                target.sendMessage("§7You have been granted 1 life. You now have " + (lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + lives + " lives")
                                target.nameTag = (lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + target.name
                                world.playSound("item.trident.thunder", { ...target.location })
                                for (let i = 0; i < 5; i++) target.dimension.spawnParticle("minecraft:totem_particle", { ...target.location }, new mc.MolangVariableMap())
                            })
                        }, 1200)
                    }
                }
                if (options.bm !== "") {
                    if (options.bmMode === "punish" || options.bmMode === "combined") {
                        const player = world.getPlayers({ name: options.bm })[0]
                        options.players[options.bm].lives = 1
                        save()
                        logs[logs.length - 1].push({ type: "Boogeyman punish", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: player.name + " is now on 1" })
                        save()
                        const lives = options.players[options.bm].lives
                        player.sendMessage("§7You failed to kill a §agreen §7or §eyellow §7name last session as the boogeyman. As punishment, you have dropped to your §cLast Life§7. All alliances are severed and you are now hostile to all players. You may team with others on their Last Life if you wish.")
                        player.nameTag = (lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + player.name
                    }
                    options.bm = ""
                    save()
                }
                world.sendMessage("§7Choosing boogeyman in 5 minutes")
                system.runTimeout(() => {
                    system.runTimeout(() => {
                        const players = world.getPlayers({ gameMode: "survival" })
                        initBM(players[getRandom(0, players.length - 1)])
                    })
                }, 6000)
            })
        }
    },
    "sessionlogs": {
        adminOnly: false,
        script: (player, args) => {
            if (logs[parseInt(args[0])] && Number.isInteger(parseInt(args[0])) && parseInt(args[0]) > -1) {
                player.sendMessage("§l§9Session " + args[0] + " logs:")
                logs[parseInt(args[0])].forEach(i => {
                    player.sendMessage("§l" + i.user + " §r§9| §r" + i.type)
                    player.sendMessage("§7" + i.time + " §9| §7" + i.location)
                    player.sendMessage(i.message)
                    player.sendMessage("---")
                })
            } else if (!args[0]) {
                player.sendMessage("Logs 0 to " + (logs.length - 1) + " are valid")
            } else player.sendMessage("§cLogs for session " + args[0] + " do not exist")
            logs[logs.length - 1].push({ type: "Request logs", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: args.join(" ") })
            save()
        }
    }
}

function assignRandomLifeCount(player, time) {
    system.runTimeout(() => {
        player.playSound("block.click")
        player.dimension.runCommand("title " + player.name + " clear")
        if (time < 33) {
            const lives = getRandom(options.randomRange[0], options.randomRange[1])
            player.onScreenDisplay.setTitle((((lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + lives.toString())), {
                stayDuration: 60,
                fadeInDuration: 0,
                fadeOutDuration: 0,
                subtitle: "",
            })
            assignRandomLifeCount(player, time + 1)
        } else {
            const lives = getRandom(options.randomRange[0], options.randomRange[1])
            options.players[player.name].lives = lives
            logs[logs.length - 1].push({ type: "Set lives", location: Object.values(player.location).map(x => Math.floor(x)).join(", "), user: player.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: player.name + " is now on " + lives })
            save()
            player.onScreenDisplay.setTitle((lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + lives + " §alives")
            player.nameTag = (lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + player.name
        }
    }, time < 10 ? 4 : (time < 20 ? 8 : (time < 30 ? 12 : 16)))
}

function randomizeLives() {
    options.initialized = true
    logs[logs.length - 1].push({ type: "Randomizing lives", location: "§cNo location§7", user: "§cNo player§7", time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: "§cNo message" })
    save()
    for (const i in options.players) {
        const p = world.getPlayers({ name: i })[0]
        p.onScreenDisplay.setTitle("§7You will have...")
        system.runTimeout(() => assignRandomLifeCount(p, 0), 40)
    }
}

function splitString(str) {
    return str.match(/.{1,250}/g)
}

//events

world.beforeEvents.chatSend.subscribe(ev => {
    const message = ev.message
    const target = ev.sender;
    if (message[0] === "@" && message.length > 1) {
        ev.cancel = true
        const argumentsIndex = message.includes(" ") ? message.indexOf(" ") : message.length
        const command = message.substring(1, argumentsIndex)
        const args = message.substring(argumentsIndex + 1).split(" ")
        if (commands[command]) {
            if (commands[command].adminOnly && target.isOp() || !commands[command].adminOnly) {
                commands[command].script(target, args)
            } else {
                target.sendMessage("§cUnknown command: " + command + ". Please check that the command exists and that you have permission to use it.")
            }
        } else {
            target.sendMessage("§cUnknown command: " + command + ". Please check that the command exists and that you have permission to use it.")
        }
    }
})

world.afterEvents.entityDie.subscribe(ev => {
    system.run(() => {
        const targetter = ev.damageSource.damagingEntity
        const target = ev.deadEntity
        if (target instanceof mc.Player) {
            logs[logs.length - 1].push({ type: "Death", location: Object.values(target.location).map(x => Math.floor(x)).join(", "), user: target.name, time: JSON.stringify(new Date()).replace("T", " ").replace("\"", "").split(".")[0], message: ev.damageSource.cause + (targetter instanceof mc.Player ? ": " + targetter.name : "") + " §9|§r " + target.name + " is now on " + (options.players[target.name].lives - 1) })
            save()
            options.players[target.name].lives--
            const lives = options.players[target.name].lives
            target.nameTag = (lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + target.name
            target.sendMessage(lives > 0 ? ("§7You died. You now have " + (lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + lives + "§7 " + (lives === 1 ? "life." : "lives.")) : "§cYou are out of lives.")
            if (target.name === options.bm && options.players[target.name].lives === 0) {
                cure(true, true)
            } else {
                if (lives === 0) {
                    target.dimension.runCommand("gamemode spectator " + target.name)
                }
                if (targetter instanceof mc.Player) {
                    if (options.bm === targetter.name) {
                        cure()
                    }
                }
            }
        }
    })
})



//gameplay loop

system.runInterval(() => {
    world.getAllPlayers().forEach(p => {
        if (!options.players[p.name]) {
            options.players[p.name] = {
                lives: 10000
            }
            save()
            p.nameTag = "§2" + p.name
            if (options.initialized) {
                assignRandomLifeCount(p, 0)
            }
        } else if (options.players[p.name].lives === 0 && !world.getPlayers({ gameMode: "spectator" }).includes(p)) {
            p.dimension.runCommand("gamemode spectator " + p.name)
        } else {
            const lives = options.players[p.name].lives
            p.nameTag = (lives < 2 ? "§c" : (lives === 2 ? "§e" : (lives === 3 ? "§a" : "§2"))) + p.name
        }
    })
})

//Save system
function save() {
    system.run(() => {
        const simulator = world.getPlayers()[0]
        const dimension = simulator.dimension
        dimension.spawnEntity("lastlife:dummy", { ...simulator.location })
        const target = dimension.getEntities({ type: "lastlife:dummy" })[0]
        const data = splitString(JSON.stringify({ "options": { ...options }, "logs": [...logs] }))
        data.forEach((item, i) => {
            target.addTag(i + item)
        })
        dimension.runCommand(`structure save lastlife:info ${Object.values(simulator.location).concat(Object.values(simulator.location)).map(x => Math.floor(x)).join(" ")} disk`)
        target.teleport({ x: target.location.x, y: 0, z: target.location.z })
        target.kill()
    })
}

(function () {
    let initComplete = false
    system.runInterval(() => {
        if (initComplete === false) {
            const simulator = world.getPlayers()[0]
            if (simulator) {
                const dimension = simulator.dimension
                dimension.runCommand(`structure load lastlife:info ${Object.values(simulator.location).map(x => Math.floor(x)).join(" ")}`)
                if (dimension.getEntities({ type: "lastlife:dummy" })[0]) {
                    const target = dimension.getEntities({ type: "lastlife:dummy" })[0]
                    const data = target.getTags().sort().map(x => x.substring(1)).join("")
                    options = JSON.parse(data).options
                    logs = JSON.parse(data).logs
                    target.kill()
                    initComplete = true

                } else {
                    save()
                }
            }

        }
    })
})()