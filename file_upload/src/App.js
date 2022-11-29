// import logo from './logo.svg';
import './App.css';
import React from 'react';
import Axios from 'axios';

const App = () => {


  let formData = new FormData();

  const onFileChange = (event) => {
    console.log(event.target.files);
    if(event.target.files[0]) {
      formData.append('file', event.target.files[0]);
    }

  };

  const SubmitFileData = async () => {
    const res = await Axios.post('http://localhost:8000/images/', formData).catch(err => {
      console.log(err);
    })
    console.log(res);
    formData = new FormData();
  }

  return (
    <div className="App">
      <div>
        <input type="file" name="file_upload" onChange = {onFileChange}/>
      </div>
      <div>
        <button onClick = {SubmitFileData}>Submit</button>
      </div>
    </div>
  );
}

export default App;