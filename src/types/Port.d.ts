import SerialPort from 'serialport'

declare namespace Port {
  interface Item {
    port: SerialPort
    parser: SerialPort.parsers.Readline
  }
}
