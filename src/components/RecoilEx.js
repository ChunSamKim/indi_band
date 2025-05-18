import { useRecoilState } from 'recoil';
import { countState } from '../states/CountAtom';

function RecoilEx() {
  const [map, setCount] = useRecoilState(countState);

  return (
    <div>
      <h3>{map.countA}</h3>
      <button onClick={() => {
        setCount({
          ...map,        
          countA: map.countA + 1 
        });
      }}>up</button>
    </div>
  );  
}

export default RecoilEx;
