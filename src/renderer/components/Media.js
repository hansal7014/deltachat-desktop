const React = require('react')
const C = require('deltachat-node/constants')
const { ipcRenderer } = require('electron')
const {
  Button, ButtonGroup
} = require('@blueprintjs/core')
const ScreenContext = require('../contexts/ScreenContext')

const styled = require('styled-components').default

const MessageWrapper = require('./message/MessageWrapper')
const Attachment = require('./message/Attachment')

const Wrapper = styled.div`
  width: 70%;
  background-color: ${props => props.theme.galleryBg};
  float: right;
  padding: 10px;
  margin-top: 50px;
`
const MediaGallery = styled.div`
  height: calc(100vh - 50px - 40px - 10px);
  overflow: scroll;
  padding-top: 20px;
`

const MediaGalleryItem = styled.div`
  float: left;

  .module-message__attachment-container {
    background-color: transparent;
    border-radius: 0px;
    margin: 0px !important;
  }

  .module-message__img-attachment {
    max-width: 120pt;
  }

  .module-message__generic-attachment__text {
    div { color: black !important; }
  }


`

const GROUPS = {
  images: {
    values: [C.DC_MSG_GIF, C.DC_MSG_IMAGE]
  },
  video: {
    values: [C.DC_MSG_VIDEO]
  },
  audio: {
    values: [C.DC_MSG_AUDIO, C.DC_MSG_VOICE]
  },
  documents: {
    values: [C.DC_MSG_FILE]
  }
}

const DEFAULT_STATE = {
  id: 'images',
  msgTypes: GROUPS.images.values,
  medias: []
}

class Media extends React.Component {
  constructor (props) {
    super(props)
    this.state = DEFAULT_STATE
  }

  componentDidMount () {
    this.onSelect(this.state.id)
  }

  componentDidUpdate (prevProps) {
    if (!prevProps.chat || (this.props.chat.id !== prevProps.chat.id)) {
      this.onSelect(this.state.id)
    }
  }

  componentWillUnmount () {
    this.setState(DEFAULT_STATE)
  }

  onSelect (id) {
    const msgTypes = GROUPS[id].values
    const medias = ipcRenderer.sendSync(
      'getChatMedia',
      msgTypes[0],
      msgTypes[1]
    )
    this.setState({ id, msgTypes, medias })
  }

  onClickMedia (message) {
    const attachment = message.msg.attachment
    if (
      message.filemime === 'application/octet-stream' &&
      !(Attachment.isVideo(attachment) || Attachment.isImage(attachment))
    ) {
      message.onDownload()
    } else {
      this.context.openDialog('RenderMedia', { message })
    }
  }

  render () {
    const { medias } = this.state
    const tx = window.translate
    return <Wrapper>
      <ButtonGroup style={{ minWidth: 200 }}>
        {Object.keys(GROUPS).map((id) => {
          return <Button
            key={id}
            disabled={this.state.id === id}
            onClick={() => this.onSelect(id)}>
            {tx(id)}
          </Button>
        })}
      </ButtonGroup>
      <MediaGallery>
        {medias.map((raw) => {
          var message = MessageWrapper.convert(raw)
          var msg = message.msg
          return <MediaGalleryItem
            onClick={this.onClickMedia.bind(this, message)}
            key={message.id}>
            {Attachment.render({
              direction: msg.direction,
              attachment: msg.attachment,
              conversationType: 'direct'
            })}
          </MediaGalleryItem>
        })}
      </MediaGallery>
    </Wrapper>
  }
}

Media.contextType = ScreenContext

module.exports = Media
