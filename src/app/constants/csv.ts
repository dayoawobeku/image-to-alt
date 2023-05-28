import {ExtendedPrediction} from '../types';

export function convertToCSV(conversions: ExtendedPrediction[]): string {
  const header = 'file name,alt text\n';
  const rows = conversions.map(
    ({fileName, output}) => `${fileName},"${output.substring(9)}"`,
  );
  return header + rows.join('\n');
}
