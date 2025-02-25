import React, { useState, useEffect } from 'react'
import { callDcMethod } from '../../ipc'
import { Classes } from '@blueprintjs/core'
import SmallDialog, { DeltaButton } from './SmallDialog'

export default function EncryptionInfo (props) {
  const [encryptionInfo, setEncryptionInfo] = useState('Fetching...')
  useEffect(() => {
    const { chat } = props
    if (!chat) return
    callDcMethod('chat.getEncryptionInfo', chat.contacts[0].id, setEncryptionInfo)
  })

  const { isOpen, onClose } = props
  const tx = window.translate
  return (
    <SmallDialog
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className='bp3-dialog-body-with-padding'>
        <p style={{ whiteSpace: 'pre-wrap' }}>
          { !encryptionInfo && 'Fetching...' }
          { encryptionInfo && encryptionInfo}
        </p>
        <div className={Classes.DIALOG_FOOTER}>
          <div
            className={Classes.DIALOG_FOOTER_ACTIONS}
            style={{ marginTop: '7px' }}
          >
            <DeltaButton style={{ float: 'right' }} onClick={onClose}>
              {tx('ok')}
            </DeltaButton>
          </div>
        </div>
      </div>
    </SmallDialog>
  )
}
