import { API_URL } from './config';

console.log('API_URL:', API_URL);

export default { 
  test: () => {
    console.log('Test import API_URL:', API_URL);
    return API_URL;
  }
}; 