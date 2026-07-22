import { List } from 'react-window';
import HimnoItem from './HimnoItem';
import type { Himno } from '../types.d';

const ROW_HEIGHT = 78;

interface RowExtraProps {
  data: Himno[];
}

function Row({ index, style, data }: RowExtraProps & { index: number; style: React.CSSProperties }) {
  const h = data[index];
  return (
    <div style={style}>
      <HimnoItem himno={h} />
    </div>
  );
}

export default function VirtualHymnList({ himnos }: { himnos: Himno[] }) {
  return (
    <div style={{ height: typeof window !== 'undefined' ? `calc(100vh - 280px)` : '600px', width: '100%' }}>
      <List<RowExtraProps>
        rowCount={himnos.length}
        rowHeight={ROW_HEIGHT}
        rowComponent={Row}
        rowProps={{ data: himnos }}
        overscanCount={5}
      />
    </div>
  );
}
