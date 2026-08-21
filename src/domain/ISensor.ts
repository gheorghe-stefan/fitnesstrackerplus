/**
 * Generic sensor interface for any data-producing sensor.
 * Implementations include Bluetooth LE sensors and virtual sensors for testing.
 *
 * @typeParam Data - The type of data this sensor produces (e.g., number for HR).
 */
export interface ISensor<Data> {
  readonly id?: string;
  readonly name: string;
  onDisconnected: (() => void) | null;
  start(notification: (data: Data) => void): Promise<void>;
  disconnect(): void;
}
