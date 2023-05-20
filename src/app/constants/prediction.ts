import axios from 'axios';

export const getPrediction = async (id: string) => {
  const response = await axios.get(`/api/predictions/${id}`);
  return response.data;
};
