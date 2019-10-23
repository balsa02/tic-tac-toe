import React from 'react';
import './App.css';
import ResponsiveDrawer from './ResponsiveDrawer';
import { ContextProvider} from './ContextProvider';
import { GraphQLClient } from './GraphQLClient';
import { NotifyCenter } from './Notify';

const App: React.FC = () => {
  return (
    <div className="App">
      <GraphQLClient>
        <ContextProvider>
            <ResponsiveDrawer/>
            <NotifyCenter/>
        </ContextProvider>
      </GraphQLClient>
    </div>
  );
}

export default App;
