import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMoon as MoonIcon, FaSun as SunIcon } from 'react-icons/fa';
import MapView from './MapView';
import {
  Box,
  VStack,
  Select,
  Button,
  Text,
  FormControl,
  FormLabel,
  useColorMode,
  IconButton,
} from '@chakra-ui/react';

const App = () => {
  const [cities, setCities] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [origin, setOrigin] = useState(null) // if there's any bug change null to ('')
  const [destination, setDestination] = useState(null) // if there's any bug change null to ('')
  const [busData, setBusData] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedBusCoords, setSelectedBusCoords] = useState(null);
  const [busSelectKey, setBusSelectKey] = useState(0);
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';

  useEffect(() => {
    fetchCitiesAndCompanies();
  }, []);

  const [busError, setBusError] = useState('');
  
  const DarkModeToggle = () => {
    const { colorMode, toggleColorMode } = useColorMode();
    const isDark = colorMode === 'dark';
  
    return (
      <IconButton
        className={'button'}
        aria-label="Toggle dark mode"
        icon={isDark ? <SunIcon /> : <MoonIcon />}
        onClick={toggleColorMode}
        position="fixed"
        bottom={4}
        right={4}
        color={isDark ? "yellow.300" : "gray.800"}
        bgColor={isDark ? "gray.800" : "gray.300"}
        isRound={true}
        size="lg"
      />
    );
  };

  useEffect(() => {
    if (selectedBus && selectedBus.latitude && selectedBus.longitude) {
    }
  }, [selectedBus]);

  const fetchCitiesAndCompanies = async () => {
    const response = await axios.post('https://seguitubus.trescruces.com.uy/api/auth/app/WSlistarrays', {
      filtros: {
        Origen: '',
        Destino: '',
        Empresa: '',
      },
    },
    );
    setCities(response.data.response.ciudades);
    setCompanies(response.data.response.empresas);
  };
  
  const fetchBusCoordinates = async (busId) => {
    const response = await axios.post(
      'https://seguitubus.trescruces.com.uy/api/auth/app/WSinfobus',
      {
        bus: busId,
      },
      );
    return {
      latitude: response.data.response.bus.latitude,
      longitude: response.data.response.bus.longitude,
    };
  };

  const handleSearch = async () => {
    const response = await axios.post('https://seguitubus.trescruces.com.uy/api/auth/app/WSlistserv', 
    {
    // if any of these are "Todas" then send null instead
      filtros: {
        Origen: origin === 'Todas' ? null : origin,
        Destino: destination === 'Todas' ? null : destination,
        Empresa: selectedCompany === 'Todas' ? null : selectedCompany,
      },
    },
    );

    if (response.data.response.servicios.length === 0) {
      setErrorMessage('No se encontraron buses con los filtros seleccionados.');
    } else {
      setErrorMessage('');
      setBusData(response.data.response.servicios);
      setBusSelectKey(busSelectKey + 1);
    }
  };

  const updateBusCoordinates = async () => {
    if (selectedBus) {
      const coordinates = await fetchBusCoordinates(selectedBus.idServicioActivo);
      setSelectedBusCoords(coordinates);
    } else {
      setSelectedBusCoords(null);
    }
  };

  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    let intervalId;
    if (selectedBus && showMap) {
      intervalId = setInterval(updateBusCoordinates, 18 * 1000); // 18s
    }
    return () => clearInterval(intervalId);
  }, [selectedBus, showMap]);
  
  const areCoordinatesValid = (coords) => {
    return coords && coords.latitude !== 0 && coords.longitude !== 0;
  };  

  return (
    <Box width="100%" maxWidth="sm" mx="auto" mt={8} p={4}>
      <VStack spacing={3} width="100%">
        <Text fontSize="3xl" fontWeight="bold">Filtrar por</Text>
  
        <FormControl>
          <FormLabel>Origen</FormLabel>
          <Select
            key={origin}
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              // if value changes, clear the error message
              setErrorMessage('');
            }}
          >
            {cities.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Destino</FormLabel>
          <Select
            key={destination}
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value)
              // if value changes, clear the error message
              setErrorMessage('');
            }}
          >
            {cities.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Empresa</FormLabel>
          <Select
            key={selectedCompany}
            value={selectedCompany}
            onChange={(e) => {
              setSelectedCompany(e.target.value);
              // if value changes, clear the error message
              setErrorMessage('');
            }}
          >
            {companies.map((company) => (
              <option key={company.name} value={company.name}>
                {company.name}
              </option>
            ))}
          </Select>
        </FormControl>
  
        <Button colorScheme="green" onClick={handleSearch}>
          Buscar
        </Button>
        {errorMessage && <Text color="red.500">{errorMessage}</Text>}
  
        {selectedBus ? (
          <Button
            colorScheme="blue"
            onClick={() => {
              setSelectedBus(null);
              setSelectedBusCoords(null);
              setShowMap(false);
              setBusError(''); // clear the error message when a new bus is selected
              busSelectKey === 0 ? setBusSelectKey(1) : setBusSelectKey(0);
              // if any of the filters have a value, clear it
              if (origin !== '') {
                setOrigin('');
              }
              if (destination !== '') {
                setDestination('');
              }
              if (selectedCompany !== '') {
                setSelectedCompany('');
              }
            }}
          >
            Limpiar selección
          </Button>
        ) : null}
          
        {busData.length > 0 && (
          <FormControl>
            <FormLabel>Lista de buses</FormLabel>
            <Select
              key={busSelectKey}
              defaultValue=""
              onChange={async (e) => {
                const busId = parseInt(e.target.value, 10);
                const bus = busData.find((bus) => bus.idServicioActivo === busId);
                if (bus) {
                  setSelectedBus(bus);
                  const coordinates = await fetchBusCoordinates(busId);
                  setSelectedBusCoords(coordinates);
                  setBusError(''); // clear the error message when a new bus is selected
                } else {
                  setSelectedBus(null);
                  setSelectedBusCoords(null);
                }
              }}
            >
              <option value="">Selecciona un bus</option>
              {busData.map((bus, index) => (
                <option
                  key={`${bus.idServicioActivo}-${index}`}
                  value={bus.idServicioActivo}
                >
                  {bus.Empresa.toUpperCase() + ': ' + bus.HoraInicioTeoricaTime + ' - ' + bus.HoraFinTeoricaTime + ' (' + bus.VarianteServicioOk + ')'}
                </option>
              ))}
            </Select>
            <Box height="1rem" />
            {busError && <Text color="red.500">{busError}</Text>}
          </FormControl>
        )}
        
        <DarkModeToggle />
            
        {selectedBus && selectedBusCoords ? (
          <Button
            colorScheme="blue"
            onClick={() => {
              if (areCoordinatesValid(selectedBusCoords)) {
                setShowMap(!showMap);
                setBusError(''); // clear the error message if coordinates are valid
              } else {
                setSelectedBus(null);
                setSelectedBusCoords(null);
                setSelectedCompany(null);
                setOrigin(null);
                setDestination(null);
                busSelectKey === 0 ? setBusSelectKey(1) : setBusSelectKey(0); // clear the bus select
                setBusError('El bus seleccionado no cuenta con GPS.');
              }
            }}
          >
            {showMap ? 'Ocultar mapa' : 'Ver ruta'}
          </Button>
        ) : null}

        {selectedBus && !showMap ? (
          <Box width="100%" textAlign="center">
            <Text fontSize="3xl" fontWeight="bold">Información del bus</Text>
            <Text>Empresa: {selectedBus.Empresa}</Text>
            <Text>Origen: {selectedBus.Origen}</Text>
            <Text>Destino: {selectedBus.Destino}</Text>
            <Text>Variante: {selectedBus.VarianteServicioOk}</Text>
            <Text>Plataforma: {selectedBus.plataforma}</Text>  
            <Text>Horario de salida: {selectedBus.HoraInicioTeoricaTime}</Text>
            <Text>Horario de llegada: {selectedBus.HoraFinTeoricaTime}</Text>
          </Box>
        ) : null}

        {selectedBus && showMap && areCoordinatesValid(selectedBusCoords) ? (
          <MapView
            latitude={selectedBusCoords.latitude}
            longitude={selectedBusCoords.longitude}
            isDarkMode={isDarkMode}
          />
        ) : null}
      </VStack>
    </Box>
  );  
};

export default App;