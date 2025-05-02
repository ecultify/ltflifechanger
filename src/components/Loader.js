import React from 'react';
import '../styles/components/Loader.css';

const Loader = ({ fullScreen = true, message = "Loading..." }) => {
  return (
    <div className={`loader-container ${!fullScreen ? 'loader-inline' : ''}`}>
      <svg 
        width="47" 
        height="48" 
        viewBox="0 0 47 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="animated-logo"
      >
        <path 
          className="logo-path"
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M20.4339 44.4543L30.1929 27.1043H23.5929L26.8729 21.2773H42.3729L39.0919 27.1203L33.4849 27.1033L23.5959 44.7203C34.6099 44.7203 43.6339 35.4773 43.6339 24.1843C43.6719 18.8178 41.5869 13.6538 37.8333 9.81816C34.0797 5.98254 28.962 3.78633 23.5959 3.70834C22.8064 3.70588 22.0176 3.75666 21.2349 3.86034L11.3949 21.2773H23.5949L20.2949 27.1033H4.81789L17.4419 4.71534C13.1436 6.20468 9.45889 9.07419 6.96197 12.8766C4.46505 16.679 3.29626 21.2007 3.63779 25.7368C3.97932 30.2729 5.81198 34.5686 8.8501 37.9543C11.8882 41.34 15.9611 43.6254 20.4339 44.4543ZM23.5959 0.777344C36.1719 0.777344 46.4819 11.2833 46.4819 24.1843C46.4819 37.1153 36.1719 47.6393 23.5969 47.6393C10.9899 47.6403 0.733887 37.1153 0.733887 24.1843C0.733887 11.2833 10.9899 0.777344 23.5959 0.777344Z" 
          fill="#0C0D0D"
        />
      </svg>
      {message && <p className="loading-text">{message}</p>}
    </div>
  );
};

export default Loader; 