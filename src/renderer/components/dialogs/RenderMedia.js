const React = require('react')
const createGlobalStyle = require('styled-components').createGlobalStyle
const { Icon, Overlay } = require('@blueprintjs/core')

const OverlayGlobal = createGlobalStyle`
`

class RenderMedia extends React.Component {
  render () {
    const tx = window.translate
    const { message, onClose } = this.props
    let elm = <div />
    if (!message || !message.msg || !message.msg.attachment) return elm
    const attachment = message.msg.attachment
    const url = attachment.url
    const contentType = attachment.contentType

    // TODO: there must be a stable external library for figuring out the right
    // html element to render
    switch (contentType.split('/')[0]) {
      case 'image':
        elm = <div className='image-container'><img src={url} /></div>
        break
      case 'audio':
        elm = <audio src={url} controls={1} />
        break
      case 'video':
        elm = <video src={url} controls={1} autoplay />
        break
      default:
        elm = null
    }
    return (
      <Overlay isOpen={Boolean(url)}
        className='attachment-overlay'
        onClose={onClose}>
        <OverlayGlobal />
        <div className='render-media-wrapper'>
          {elm &&
            <div className='btn-wrapper' style={{ right: '5px' }}>
              <Icon onClick={onClose} icon='cross' iconSize={32} color={'grey'} aria-label={tx('close')} />
            </div>
          }
          <div className='attachment-view'>
            {elm}
          </div>
          <div className='btn-wrapper' style={{ right: 0, bottom: 0 }}>
            <div role='button'
              onClick={message.onDownload}
              className='download-btn'
              aria-label={tx('save')} />
          </div>
        </div>
      </Overlay>
    )
  }
}

module.exports = RenderMedia
