import type { ComponentType } from 'react'
import QRCodeImport, { type QRCodeProps } from 'react-qr-code'

// CJS package — default import can be the module namespace in Vite.
const QRCode = (
  typeof QRCodeImport === 'function'
    ? QRCodeImport
    : (QRCodeImport as { default: ComponentType<QRCodeProps> }).default
) as ComponentType<QRCodeProps>

export function CheckInQrImage({ value, size = 140 }: { value: string; size?: number }) {
  return (
    <QRCode
      value={value}
      size={size}
      style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
      viewBox="0 0 256 256"
    />
  )
}
