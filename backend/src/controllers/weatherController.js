const axios = require('axios')

const API_KEY  = process.env.OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5'

const getWeather = async (req, res) => {
  const { destination } = req.query

  if (!destination) {
    return res.status(400).json({ error: true, message: 'Destino é obrigatório' })
  }

  if (!API_KEY) {
    return res.status(500).json({ error: true, message: 'API Key não configurada' })
  }

  // try/catch para erros do axios
  let currentResponse, forecastResponse
  try {
    ;[currentResponse, forecastResponse] = await Promise.all([
      axios.get(`${BASE_URL}/weather`, {
        params: { q: destination, appid: API_KEY, units: 'metric', lang: 'pt_br' },
      }),
      axios.get(`${BASE_URL}/forecast`, {
        params: { q: destination, appid: API_KEY, units: 'metric', lang: 'pt_br', cnt: 40 },
      }),
    ])
  } catch (err) {
    const status = err.response?.status

    if (status === 404) {
      return res.status(404).json({
        error:   true,
        message: `Cidade "${destination}" não encontrada. Tente um nome mais específico (ex: "São Paulo, BR")`,
      })
    }

    if (status === 401) {
      return res.status(500).json({
        error:   true,
        message: 'API Key de clima inválida ou expirada',
      })
    }

    if (status === 429) {
      return res.status(429).json({
        error:   true,
        message: 'Limite de requisições de clima atingido. Tente novamente em breve.',
      })
    }

    return res.status(500).json({
      error:   true,
      message: 'Erro ao buscar dados de clima. Tente novamente.',
    })
  }

  const current  = currentResponse.data
  const forecast = forecastResponse.data

  // ── Agrupa previsão por dia ───────────────────────────────
  const dailyMap = {}
  forecast.list.forEach((item) => {
    const date = item.dt_txt.split(' ')[0]
    if (!dailyMap[date]) {
      dailyMap[date] = {
        date,
        temps:        [],
        descriptions: [],
        icons:        [],
        humidity:     [],
        windSpeed:    [],
      }
    }
    dailyMap[date].temps.push(item.main.temp)
    dailyMap[date].descriptions.push(item.weather[0].description)
    dailyMap[date].icons.push(item.weather[0].icon)
    dailyMap[date].humidity.push(item.main.humidity)
    dailyMap[date].windSpeed.push(item.wind.speed)
  })

  const daily = Object.values(dailyMap)
    .slice(0, 5)
    .map((day) => ({
      date:        day.date,
      tempMin:     Math.round(Math.min(...day.temps)),
      tempMax:     Math.round(Math.max(...day.temps)),
      description: day.descriptions[Math.floor(day.descriptions.length / 2)],
      icon:        day.icons[Math.floor(day.icons.length / 2)],
      humidity:    Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
      windSpeed:   Math.round(
        (day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length) * 3.6 // m/s → km/h
      ),
    }))

  return res.json({
    city:    current.name,
    country: current.sys.country,
    current: {
      temp:        Math.round(current.main.temp),
      feelsLike:   Math.round(current.main.feels_like),
      tempMin:     Math.round(current.main.temp_min),
      tempMax:     Math.round(current.main.temp_max),
      humidity:    current.main.humidity,
      windSpeed:   Math.round(current.wind.speed * 3.6), // m/s → km/h
      description: current.weather[0].description,
      icon:        current.weather[0].icon,
    },
    daily,
  })
}

module.exports = { getWeather }
