const Discord = require('discord.js')
const client = new Discord.Client()
const tokens = require('./tokens.json')

require('dotenv').config()

client.on('ready', () => {
  client.user.setActivity(`${tokens.prefix}help`, {
    type: 'PLAYING'
  })
  console.log(`${client.user.tag} running on ${client.guilds.size} guilds with ${client.users.size} users.`)
})

client.on('message', async msg => {
  if (msg.author.id !== tokens.ownerId)
    return
  
  if (msg.content.startsWith(tokens.prefix + "help")) {
    await sendEmbed(msg, "Help")
  }
  
  if (msg.content.startsWith(tokens.prefix + "colors")) {
    await sendEmbed(msg, "Yes")
    
    for (const [, member] of msg.guild.members) {
      const color = await tokens.colors[Math.floor(Math.random()*tokens.colors.length)]
      await member.addRole(color).then(member => console.log(`Added random color to ${member.displayName}`)).catch(console.error)
    }
  }
})

function sendEmbed(msg, desc) {
  msg.channel.send({
    embed: {
      description: desc
    }
  })
}

client.login(process.env.BOT_TOKEN)