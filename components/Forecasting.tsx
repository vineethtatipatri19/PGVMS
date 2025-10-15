
import React, { useState } from 'react';
import Card from './common/Card';
import Button from './common/Button';
import { getDemandForecast, ForecastInput, ForecastResult } from '../services/geminiService';

const Forecasting: React.FC = () => {
  const [forecast, setForecast] = useState<ForecastResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState('Sunny and Warm');
  const [season, setSeason] = useState('Summer');

  const mockHistoricalData = [
      { date: '2023-05-01', itemName: 'Tomatoes', soldQty: 150 },
      { date: '2023-05-01', itemName: 'Apples', soldQty: 200 },
      { date: '2023-05-02', itemName: 'Tomatoes', soldQty: 160 },
      { date: '2023-05-02', itemName: 'Bananas', soldQty: 120 },
  ];

  const itemsToForecast = ['Tomatoes', 'Apples', 'Bananas'];

  const handleGenerateForecast = async () => {
    setIsLoading(true);
    setError(null);
    setForecast(null);

    const input: ForecastInput = {
      historicalData: mockHistoricalData,
      weather,
      season,
      itemsToForecast
    };

    try {
      const result = await getDemandForecast(input);
      setForecast(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-6">AI Demand Forecasting</h2>
      
      <Card className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Forecasting Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="weather" className="block text-sm font-medium text-gray-700">Weather Condition</label>
            <input 
              type="text" 
              id="weather"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label htmlFor="season" className="block text-sm font-medium text-gray-700">Season</label>
            <input 
              type="text" 
              id="season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div className="self-end">
            <Button onClick={handleGenerateForecast} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Forecast'}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
            Note: This uses mocked historical data to generate a forecast.
        </p>
      </Card>

      {error && <Card className="bg-red-50 border-red-200"><p className="text-red-700">{error}</p></Card>}
      
      {isLoading && (
          <div className="text-center py-8">
              <p className="text-lg text-gray-600">Generating forecast with Gemini AI...</p>
              <div className="mt-4 animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
      )}

      {forecast && (
        <Card title="Demand Forecast Results">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Predicted Demand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Justification</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forecast.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">{item.predictedDemand} {item.unit}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.justification}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Forecasting;
