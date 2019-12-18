const Discord = require('discord.js')
const client = new Discord.Client()
const settings = require('./settings.json')
const sql = require('sqlite')

require('dotenv').config()

sql.open('./database.sqlite') // Create database

client.on('ready', async () => {
  await client.user.setActivity(`${settings.prefix}help`, {
    type: 'PLAYING'
  })
  await console.log(`${client.user.tag} running on ${client.guilds.size} guilds with ${client.users.size} users.`)
  
  await sql.run('CREATE TABLE IF NOT EXISTS settings (guildid TEXT UNIQUE, prefix VARCHAR, colors VARCHAR)').then(async () => {
    for (const guild of client.guilds.values()) {
      await sql.run('INSERT OR IGNORE INTO settings (guildid, prefix) VALUES (?, ?)', [guild.id, 'v!'])
    }
  })
})

client.on('message', async msg => {
  if (msg.author.id !== settings.ownerId)
    return
  
  if (msg.content.startsWith(settings.prefix + "help")) {
    await sendEmbed(msg, "There is only one command: \`v!colors\`")
  }
  
  if (msg.content.startsWith(settings.prefix + "colors")) {
    const args = msg.content.split(' ')
    
    if (args[1] === undefined) {
      await msg.channel.send({
        embed: {
          description: 'Please specify the correct parameters for this command.',
          fields: [
            {
              name: 'Command',
              value: `${settings.prefix}colors`,
              inline: true
            },
            {
              name: 'Parameters',
              value: `setup, process`,
              inline: true
            }
          ]
        }
      })
      
      return
    }
    
    if (args[1] === 'setup') {
      const colors = args.slice(2)
      
      if (colors.length === 0){
        sendEmbed(msg, 'You need to specify the names of the color roles you want to add to the setup process.')
        return
      }
      
      let discard = []
      let found = []
      
      for (const color of colors) {
        const role = await msg.guild.roles.find(val => val.name === color)
        
        
        
        if (role !== null) {
          await found.push(role.name)
        } else {
          await discard.push(color)
        }
      }
      
      if (found.length === 0) {
        await sendEmbed(msg, 'Did not find any roles of those names.')
        return
      }
      
      await msg.channel.send({
        embed: {
          description: `The setup process is complete.`,
          fields: [
            {
              name: 'Found',
              value: found.join('\n'),
              inline: true
            },
            {
              name: 'Not Found',
              value: discard.length === 0 ? 'None were discarded' : discard.join('\n'),
              inline: true
            }
          ]
        }
      })
      
      //TODO: Update the color roles in the Sqlite database then use them in the color process.
    }
    
    if (args[1] === 'process') {
      let begin = Date.now()
      
      let id
      await sendEmbed(msg, "Processing your request, please be patient.").then(m => {
        id = m.id
      })
      
      const members = msg.guild.members
      let counter = 1
      
      for (const [, member] of members) {
        let end = Date.now()
        
        const color = await settings.colors[Math.floor(Math.random()*settings.colors.length)]
        await member.addRole(color).then(member => console.log(`Added random color to ${member.displayName} - ${counter}/${members.size}`)).catch(console.error)
        if (counter % settings.messageUpdateDelay == 0 || counter == members.size) {
          await msg.channel.messages.get(id).edit({
            embed: {
              description: `Processed ${counter} / ${members.size} Members (${Math.round((counter / members.size) * 100)}% Complete)`,
              fields: [
                {
                  name: 'Current',
                  value: member.displayName,
                  inline: true
                },
                {
                  name: 'Assigned',
                  value: msg.guild.roles.get(color).name,
                  inline: true
                },
                {
                  name: 'Elapsed',
                  value: `${(end - begin) / 1000} seconds`,
                  inline: true
                }
              ],
              footer: {
                text: `Executor: ${msg.author.tag}`
              }
            }
          })
        }
        await counter++
      }
    }
  }
})

client.on('guildCreate', (guild) => {
  console.log(`I have joined the guild ${guild.name}`)
  sql.run('INSERT OR IGNORE INTO settings (guildid) VALUES (?)', [guild.id])
})

client.on('guildDelete', (guild) => {
  console.log(`I have left the guild ${guild.name}`)
  sql.run('DELETE * FROM settings WHERE guildid = ?', [guild.id])
})

function editEmbed(msg, desc) {
  return msg.edit({
    embed: {
      description: desc
    }
  })
}

function sendEmbed(msg, desc) {
  return msg.channel.send({
    embed: {
      description: desc
    }
  })
}

client.login(process.env.BOT_TOKEN)