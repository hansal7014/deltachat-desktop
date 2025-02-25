const React = require('react')
const { ipcRenderer } = require('electron')
const classNames = require('classnames')
const mimeTypes = require('mime-types')

const {
  isImageTypeSupported, isVideoTypeSupported, MIME
} = require('../conversations')

const MINIMUM_IMG_HEIGHT = 150
const MAXIMUM_IMG_HEIGHT = 300

module.exports = {
  render,
  isAudio,
  isImage,
  hasImage,
  isVideo,
  hasVideoScreenshot,
  isDisplayableByRenderMedia
}

function isImage (attachment) {
  return (
    attachment &&
    attachment.contentType &&
    isImageTypeSupported(attachment.contentType)
  )
}

function hasImage (attachment) {
  return attachment && attachment.url
}

function isVideo (attachment) {
  return (
    attachment &&
    attachment.contentType &&
    isVideoTypeSupported(attachment.contentType)
  )
}

function hasVideoScreenshot (attachment) {
  return attachment && attachment.screenshot && attachment.screenshot.url
}

function isAudio (attachment) {
  return (
    attachment && attachment.contentType && MIME.isAudio(attachment.contentType)
  )
}

function isDisplayableByRenderMedia (attachment) {
  return isImage(attachment) || isAudio(attachment) || isVideo(attachment)
}

function getExtension ({ fileName, contentType }) {
  if (fileName && fileName.indexOf('.') >= 0) {
    const lastPeriod = fileName.lastIndexOf('.')
    const extension = fileName.slice(lastPeriod + 1)
    if (extension.length) {
      return extension
    }
  }

  return mimeTypes.extension(contentType) || null
}

function dragAttachmentOut (attachment, dragEvent) {
  dragEvent.preventDefault()
  ipcRenderer.send('ondragstart', attachment.url)
}

function render (props) {
  const {
    attachment,
    text,
    conversationType,
    direction,
    onClickAttachment
  } = props
  const tx = window.translate

  if (!attachment) {
    return null
  }

  const withCaption = Boolean(text)
  // For attachments which aren't full-frame
  const withContentBelow = withCaption
  const withContentAbove = conversationType === 'group' && direction === 'incoming'

  if (isImage(attachment)) {
    if (!attachment.url) {
      return (
        <div
          className={classNames(
            'module-message__broken-image',
            `module-message__broken-image--${direction}`
          )}
        >
          {tx('imageFailedToLoad')}
        </div>
      )
    }

    // Calculating height to prevent reflow when image loads
    const height = Math.max(MINIMUM_IMG_HEIGHT, attachment.height || 0)

    return (
      <div
        onClick={onClickAttachment}
        role='button'
        className={classNames(
          'module-message__attachment-container',
          withCaption
            ? 'module-message__attachment-container--with-content-below'
            : null,
          withContentAbove
            ? 'module-message__attachment-container--with-content-above'
            : null
        )}
      >
        <img
          className='module-message__img-attachment'
          height={Math.min(MAXIMUM_IMG_HEIGHT, height)}
          src={attachment.url}
        />
      </div>
    )
  } else if (isVideo(attachment)) {
    if (!attachment.url) {
      return (
        <div
          role='button'
          onClick={onClickAttachment}
          className={classNames(
            'module-message__broken-video-screenshot',
            `module-message__broken-video-screenshot--${direction}`
          )}
        >
          {tx('videoScreenshotFailedToLoad')}
        </div>
      )
    }

    // Calculating height to prevent reflow when image loads
    const height = Math.max(MINIMUM_IMG_HEIGHT, 0)

    return (
      <div
        onClick={onClickAttachment}
        role='button'
        className={classNames(
          'module-message__attachment-container',
          withCaption
            ? 'module-message__attachment-container--with-content-below'
            : null,
          withContentAbove
            ? 'module-message__attachment-container--with-content-above'
            : null
        )}
      >
        <video
          className='module-message__img-attachment'
          height={Math.min(MAXIMUM_IMG_HEIGHT, height)}
          src={attachment.url}
          controls={1}
        />
        <div className='module-message__video-overlay__circle'>
          <div className='module-message__video-overlay__play-icon' />
        </div>
      </div>
    )
  } else if (isAudio(attachment)) {
    return (
      <audio
        controls
        className={classNames(
          'module-message__audio-attachment',
          withContentBelow
            ? 'module-message__audio-attachment--with-content-below'
            : null,
          withContentAbove
            ? 'module-message__audio-attachment--with-content-above'
            : null
        )}
      >
        <source src={attachment.url} />
      </audio>
    )
  } else {
    const { fileName, fileSize, contentType } = attachment
    const extension = getExtension({ contentType, fileName })

    return (
      <div
        className={classNames(
          'module-message__generic-attachment',
          withContentBelow
            ? 'module-message__generic-attachment--with-content-below'
            : null,
          withContentAbove
            ? 'module-message__generic-attachment--with-content-above'
            : null
        )}
      >
        <div
          className='module-message__generic-attachment__icon'
          draggable='true'
          onClick={onClickAttachment}
          onDragStart={dragAttachmentOut.bind(null, attachment)}
          title={contentType}
        >
          {extension ? (
            <div className='module-message__generic-attachment__icon__extension'>
              { contentType === 'application/octet-stream' ? '' : extension}
            </div>
          ) : null}
        </div>
        <div className='module-message__generic-attachment__text'>
          <div
            className={classNames(
              'module-message__generic-attachment__file-name',
              `module-message__generic-attachment__file-name--${direction}`
            )}
          >
            {fileName}
          </div>
          <div
            className={classNames(
              'module-message__generic-attachment__file-size'
            )}
          >
            {fileSize}
          </div>
        </div>
      </div>
    )
  }
}
