const tokeniseMessage = (message, instances) => {
  if (!message || !instances) {
    return [{
      type: 'text',
      content: message,
    }]
  }

  const tokens = []
  let nextTokenStartIndex = 0

  instances.forEach((instance) => {
    if (instance.start !== nextTokenStartIndex) {
      tokens.push({
        type: 'text',
        content: message.slice(nextTokenStartIndex, instance.start),
      })
    }

    tokens.push({
      type: instance.type,
      content: instance.content,
    })

    nextTokenStartIndex = instance.end + 1
  })

  if (nextTokenStartIndex !== message.length) {
    tokens.push({
      type: 'text',
      content: message.slice(nextTokenStartIndex),
    })
  }

  return tokens
}

const parseEmotes = (message, emotes) => {
  const instances = []

  Object.keys(emotes).forEach((key) => {
    emotes[key].forEach((occurrence) => {
      const [start, end] = occurrence.split('-').map(idx => parseInt(idx, 10))

      instances.push({
        type: 'emote',
        start,
        end,
        content: {
          title: message.slice(start, end + 1),
          key,
        }
      })
    })
  })

  return tokeniseMessage(message, instances)
}

const parseCheermotes = (message, cheermotes) => {
  const instances = []

  const emoteNames = Object.keys(cheermotes).join('|')
  const emoteRegex = new RegExp(`\\b(${emoteNames})(\\d+)\\b`, 'ig')

  let match = emoteRegex.exec(message)

  while (match !== null) {
    instances.push({
      type: 'cheer',
      start: match.index,
      end: emoteRegex.lastIndex - 1,
      content: {
        title: `${match[1]}${match[2]}`,
        key: match[1],
        bits: match[2],
      }
    })

    match = emoteRegex.exec(message)
  }

  return tokeniseMessage(message, instances)
}

const parseTokens = (tokens, tokeniser) => {
  if (!Array.isArray(tokens)) {
    return tokeniser(tokens)
  }

  return tokens.map(
    token => token.type === 'text' ? tokeniser(token) : token
  ).reduce(
    (tokenArray, token) => tokenArray.concat(token), []
  )
}

const getUserDetails = (userstate = {}) => ({
  id: userstate['user-id'],
  username: userstate.username,
  'display-name': userstate['display-name'],
  'user-type': userstate['user-type'], // empty, mod, global-mod, admin, staff
  color: userstate.color,
  badges: userstate.badges,
  mod: userstate.mod,
  turbo: userstate.turbo,
  subscriber: userstate.subscriber,
  broadcaster: (userstate.badges && userstate.badges.broadcaster !== undefined)
})

const getMessageDetails = (message, userstate = {}) => ({
  id: userstate.id,
  type: userstate['message-type'],
  emotes: userstate.emotes,
  tokens: parseTokens(
    message,
    token => parseEmotes(token, userstate.emotes)
  ),
  raw: message,
})

module.exports = {
  parseEmotes,
  parseCheermotes,
  parseTokens,
  getUserDetails,
  getMessageDetails,
}
