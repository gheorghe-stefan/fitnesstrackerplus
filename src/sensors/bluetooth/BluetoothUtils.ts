export class BluetoothUtils
{
    static ToBinaryString(fitnessMachineFeatures: number) {
        let s = fitnessMachineFeatures.toString(2);
        // while (s.length < 32)
        //     s = "0" + s;
        return s;
    }
    public static DataViewToString(data: DataView) {
        let a = [];
        for (let i = 0; i < data.byteLength; i++) {
            a.push('0x' + ('00' + data.getUint8(i).toString(16)).slice(-2));
        }
        return a.join(' ');
    }
}