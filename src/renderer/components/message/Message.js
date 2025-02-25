const React = require('react')
const { useRef, useState } = require('react')
const classNames = require('classnames')

const MessageBody = require('./MessageBody').default
const MessageMetaData = require('./MessageMetaData')

const ContactName = require('../conversations/ContactName')
const { ContextMenu, ContextMenuTrigger, MenuItem } = require('react-contextmenu')
const Attachment = require('./Attachment')

const Avatar = ({ contact }) => {
  const {
    profileImage,
    color,
    name,
    address
  } = contact

  const alt = `${name || address}`

  if (profileImage) {
    return (
      <div className='author-avatar'>
        <img alt={alt} src={profileImage} />
      </div>
    )
  } else {
    return (
      <div className='author-avatar default'
        alt={alt}
      >
        <div
          style={{ backgroundColor: color }}
          className='label'>
          {(name && name.trim()[0]) || '#'}
        </div>
      </div>
    )
  }
}

const Author = ({ contact }) => {
  const {
    color,
    name,
    address
  } = contact

  return (
    <ContactName
      email={address}
      name={name}
      module='author'
      color={color}
    />
  )
}

const InlineMenu = (MenuRef, showMenu, triggerId, props) => {
  const {
    attachment,
    onDownload,
    onReply,
    viewType
  } = props
  const tx = window.translate

  return (
    <div className='message-buttons'>
      {
        attachment && viewType !== 23 && <div
          onClick={onDownload}
          role='button'
          className='msg-button download hide-on-small'
          aria-label={tx('save')}
        />
      }
      <div
        onClick={onReply}
        role='button'
        className='msg-button reply hide-on-small'
      />
      <ContextMenuTrigger id={triggerId} ref={MenuRef}>
        <div
          role='button'
          onClick={showMenu}
          className='msg-button menu'
          aria-label={tx('a11y_message_context_menu_btn_label')}
        />
      </ContextMenuTrigger>
    </div>
  )
}

const contextMenu = (props, textSelected, triggerId) => {
  const {
    attachment,
    direction,
    status,
    onDelete,
    onDownload,
    onReply,
    onForward,
    onRetrySend,
    onShowDetail
  } = props
  const tx = window.translate

  let showRetry = status === 'error' && direction === 'outgoing'
  showRetry = false // TODO: retry send is not yet implemented

  return (
    <ContextMenu id={triggerId}>
      <MenuItem
        attributes={{
          hidden: !textSelected
        }}
        onClick={_ => {
          navigator.clipboard.writeText(window.getSelection().toString())
        }}
      >
        {tx('menu_copy_to_clipboard')}
      </MenuItem>
      {attachment ? (
        <MenuItem onClick={onDownload}>
          {tx('download_attachment_desktop')}
        </MenuItem>
      ) : null}
      <MenuItem onClick={onReply}>
        {tx('reply_to_message_desktop')}
      </MenuItem>
      <MenuItem onClick={onForward}>
        {tx('menu_forward')}
      </MenuItem>
      <MenuItem onClick={onShowDetail}>
        {tx('more_info_desktop')}
      </MenuItem>
      {showRetry ? (
        <MenuItem onClick={onRetrySend}>
          {tx('retry_send')}
        </MenuItem>
      ) : null}
      <MenuItem onClick={onDelete} >
        {tx('delete_message_desktop')}
      </MenuItem>
    </ContextMenu>
  )
}

const Message = (props) => {
  const {
    authorAddress,
    direction,
    id,
    timestamp,
    viewType,
    conversationType,
    message,
    text,
    disableMenu,
    status
  } = props

  // This id is what connects our triple-dot click with our associated pop-up menu.
  //   It needs to be unique.
  const triggerId = String(id || `${authorAddress}-${timestamp}`)

  const onShowDetail = props.onShowDetail

  const MenuRef = useRef(null)
  const [textSelected, setTextSelected] = useState(false)

  const showMenu = (event) => {
    if (MenuRef.current) {
      setTextSelected(window.getSelection().toString() !== '')
      MenuRef.current.handleContextClick(event)
    }
  }

  const menu = !disableMenu && InlineMenu(MenuRef, showMenu, triggerId, props)

  // TODO another check - don't check it only over string
  const longMessage = /\[.{3}\]$/.test(text)

  return (
    <div
      onContextMenu={showMenu}
      className={classNames(
        'message',
        direction,
        { 'type-sticker': viewType === 23 },
        { error: status === 'error' }
      )}
    >
      {conversationType === 'group' && direction === 'incoming' && Avatar(message)}
      {menu}
      <div
        onContextMenu={showMenu}
        className='msg-container'
      >
        {direction === 'incoming' && conversationType === 'group' && Author(message)}
        {Attachment.render(props)}

        <div dir='auto' className='text' >
          <MessageBody text={text || ''} />
        </div>
        {longMessage && <button onClick={onShowDetail}>...</button>}
        <MessageMetaData {...props} />
      </div>
      <div onClick={ev => { ev.stopPropagation() }}>
        {contextMenu(props, textSelected, triggerId)}
      </div>
    </div>
  )
}

module.exports = Message
