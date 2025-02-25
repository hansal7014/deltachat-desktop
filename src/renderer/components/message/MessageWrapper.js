const React = require('react')
const path = require('path')
const C = require('deltachat-node/constants')
const styled = require('styled-components').default
const Message = require('./Message')
const { remote, ipcRenderer } = require('electron')
const moment = require('moment')
const mime = require('mime-types')
const filesizeConverter = require('filesize')
const log = require('../../../logger').getLogger('renderer/messageWrapper')

const GROUP_TYPES = [
  C.DC_CHAT_TYPE_GROUP,
  C.DC_CHAT_TYPE_VERIFIED_GROUP
]

const InfoMessage = styled.div`
  width: 100%;
  text-align: center;
  margin: 26px 0px;

  p {
    display: inline-block;
    text-align: center;
    font-style: italic;
    font-weight: bold;
    padding: 7px 14px;
    background-color: ${props => props.theme.infoMessageBubbleBg};
    border-radius: 10px;
    opacity: 0.44;
    color: ${props => props.theme.infoMessageBubbleText};
  }
`

function render (props) {
  const { message, onClickSetupMessage, onClickContactRequest } = props

  let body

  if (message.id === C.DC_MSG_ID_DAYMARKER) {
    const key = message.daymarker.id + message.daymarker.timestamp
    body = (
      <InfoMessage key={key}>
        <p>
          {moment.unix(message.daymarker.timestamp).calendar(null, {
            lastDay: '',
            lastWeek: 'LL',
            sameElse: 'LL'
          })}
        </p>
      </InfoMessage>
    )
  } else if (message.msg.isSetupmessage) {
    body = (
      <div className='setupMessage pointer' key={message.id}
        onClick={onClickSetupMessage}>
        <RenderMessage {...props} />
      </div>
    )
  } else if (message.msg.chatId === C.DC_CHAT_ID_DEADDROP) {
    body = (
      <div key={message.id}
        onClick={onClickContactRequest} className={'pointer'}>
        <RenderMessage {...props} />
      </div>
    )
  } else {
    body = <RenderMessage {...props} />
  }

  return <li>{body}</li>
}

/**
 * RenderMessage takes a message already created with Message.convert
 * and returns a React component of that message from the Conversations
 * library. This class mostly just converts the necessary properties to what
 * is expected by Conversations.Message
 */
class RenderMessage extends React.Component {
  constructor (props) {
    super(props)
    this.el = React.createRef()
  }

  componentDidMount () {
    if (!this.el.current) return
    var as = this.el.current.querySelectorAll('a')
    as.forEach((a) => {
      a.onclick = (event) => {
        event.preventDefault()
        remote.shell.openExternal(a.href)
      }
    })
  }

  render () {
    const { onDelete, onShowDetail, onClickAttachment, chat, message } = this.props
    const { fromId, id } = message
    const msg = message.msg
    const conversationType = convertChatType(chat.type)

    const contact = {
      onSendMessage: () => log.debug(`send a message to ${fromId}`),
      onClick: () => { log.debug('click contact') }
    }

    if (msg.text === '[The message was sent with non-verified encryption.. See "Info" for details.]') {
      msg.text = window.translate('message_not_verified')
    }

    const props = {
      padlock: msg.showPadlock,
      id,
      conversationType,
      onDownload: message.onDownload,
      onReply: message.onReply,
      onForward: message.onForward,
      onDelete,
      onShowDetail,
      contact,
      onClickAttachment,
      authorAddress: message.contact.address,
      status: msg.status,
      text: msg.text,
      direction: msg.direction,
      timestamp: msg.sentAt,
      viewType: msg.viewType,
      message
    }

    if (msg.attachment && !msg.isSetupmessage) props.attachment = msg.attachment
    if (message.isInfo) return <InfoMessage><p>{msg.text}</p></InfoMessage>

    return (<div ref={this.el}><Message {...props} /></div>)
  }
}

function convert (message) {
  message.onDownload = () => {
    const defaultPath = path.join(remote.app.getPath('downloads'), path.basename(message.msg.file))
    remote.dialog.showSaveDialog({
      defaultPath
    }, (filename) => {
      if (filename) ipcRenderer.send('saveFile', message.msg.file, filename)
    })
  }

  const msg = message.msg

  if (msg.isSetupmessage) {
    msg.text = window.translate('autocrypt_asm_click_body')
  }

  Object.assign(msg, {
    sentAt: msg.timestamp * 1000,
    receivedAt: msg.receivedTimestamp * 1000,
    direction: message.isMe ? 'outgoing' : 'incoming',
    status: convertMessageStatus(msg.state)
  })

  if (msg.file) {
    msg.attachment = {
      url: msg.file,
      contentType: convertContentType(message),
      fileName: message.filename || msg.text,
      fileSize: filesizeConverter(message.filesize)
    }
  }

  return message
}

function convertMessageStatus (s) {
  switch (s) {
    case C.DC_STATE_IN_FRESH:
      return 'sent'
    case C.DC_STATE_OUT_FAILED:
      return 'error'
    case C.DC_STATE_IN_SEEN:
      return 'read'
    case C.DC_STATE_IN_NOTICED:
      return 'read'
    case C.DC_STATE_OUT_DELIVERED:
      return 'delivered'
    case C.DC_STATE_OUT_MDN_RCVD:
      return 'read'
    case C.DC_STATE_OUT_PENDING:
      return 'sending'
    case C.DC_STATE_UNDEFINED:
      return 'error'
  }
}

function convertContentType (message) {
  const filemime = message.filemime

  if (!filemime) return 'application/octet-stream'
  if (filemime !== 'application/octet-stream') return filemime

  switch (message.msg.viewType) {
    case C.DC_MSG_IMAGE:
      return 'image/jpg'
    case C.DC_MSG_VOICE:
      return 'audio/ogg'
    case C.DC_MSG_FILE:
      const type = mime.lookup(message.msg.file)
      if (type) return type
      else return 'application/octet-stream'
    default:
      return 'application/octet-stream'
  }
}

function convertChatType (type) {
  return GROUP_TYPES.includes(type) ? 'group' : 'direct'
}

module.exports = {
  convert,
  render
}
