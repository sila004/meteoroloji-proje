export default function WeatherAttribution() {
  return <p className="weather-attribution">
    Hava verisi kaynakları:{" "}
    <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
    {" · "}
    <a href="https://www.visualcrossing.com/" target="_blank" rel="noopener noreferrer">Visual Crossing Weather</a>
  </p>;
}
