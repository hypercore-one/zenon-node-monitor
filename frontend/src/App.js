import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import axios from 'axios';

const truncateHash = (hash) => {
  if (!hash) return '';
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
};

const findMatchingMomentums = (allNodeData) => {
  const heightsMap = {};
  const connectedNodes = Object.values(allNodeData).filter(node => node.is_connected);
  const connectedNodeCount = connectedNodes.length;
  
  if (connectedNodeCount < 2) {
    return [];
  }
  
  connectedNodes.forEach(nodeData => {
    nodeData.momentums?.forEach(momentum => {
      if (!momentum.is_stale) {
        if (!heightsMap[momentum.height]) {
          heightsMap[momentum.height] = {
            count: 1,
            hashes: new Set([momentum.hash])
          };
        } else {
          heightsMap[momentum.height].count++;
          heightsMap[momentum.height].hashes.add(momentum.hash);
        }
      }
    });
  });

  return Object.entries(heightsMap)
    .filter(([_, data]) => data.count === connectedNodeCount)
    .map(([height, data]) => ({
      height: parseInt(height),
      hashesMatch: data.hashes.size === 1
    }))
    .sort((a, b) => b.height - a.height);
};

const StatusIndicator = ({ isConnected }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        position: 'relative',
        width: 10,
        height: 10,
        display: 'inline-flex',
        marginRight: 1,
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: isConnected ? theme.palette.success.main : theme.palette.error.main,
          position: 'relative',
          zIndex: 1,
        }}
      />
      {isConnected && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: theme.palette.success.main,
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(1)',
                opacity: 0.5,
              },
              '70%': {
                transform: 'scale(2)',
                opacity: 0,
              },
              '100%': {
                transform: 'scale(2.5)',
                opacity: 0,
              },
            },
          }}
        />
      )}
    </Box>
  );
};

const MomentumCard = ({ momentum, isMatching, heightExists, isStale }) => {
  const theme = useTheme();
  
  return (
    <Box 
      sx={{ 
        p: 1.5,
        borderRadius: 3,
        backgroundColor: alpha(theme.palette.background.paper, 0.5),
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        opacity: isStale ? 0.5 : 1,
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: alpha(theme.palette.background.paper, 0.7),
          transform: 'translateY(-2px)',
        },
        mb: 1.5,
      }}
    >
      {isStale && (
        <Typography
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            fontSize: 11,
            color: theme.palette.warning.main,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
          }}
        >
          Stale
        </Typography>
      )}
      <Typography 
        variant="body2" 
        sx={{ 
          color: heightExists ? (isMatching ? theme.palette.success.main : theme.palette.error.main) : theme.palette.text.secondary,
          fontFamily: 'SF Mono, monospace',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          mb: 0.5,
        }}
      >
        Height: {momentum.height}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          color: heightExists ? (isMatching ? theme.palette.success.main : theme.palette.error.main) : theme.palette.text.secondary,
          fontFamily: 'SF Mono, monospace',
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}
      >
        Hash: {truncateHash(momentum.hash)}
      </Typography>
    </Box>
  );
};

const NodeCard = ({ nodeName, data, allNodeData }) => {
  const theme = useTheme();
  const isConnected = data?.is_connected;
  const momentums = [...(data?.momentums || [])].sort((a, b) => b.height - a.height);
  const matchingMomentums = findMatchingMomentums(allNodeData);

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3,
        height: '100%',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(20px) saturate(180%)',
        '-webkit-backdrop-filter': 'blur(20px) saturate(180%)',
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        opacity: isConnected ? 1 : 0.7,
        transition: 'all 0.3s ease',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            color: theme.palette.primary.main,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            mb: 1,
          }}
        >
          {nodeName}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <StatusIndicator isConnected={isConnected} />
          <Typography 
            variant="body2" 
            sx={{ 
              color: isConnected ? theme.palette.success.main : theme.palette.error.main,
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {momentums.map((momentum) => {
          const matchingHeight = matchingMomentums.find(m => m.height === momentum.height);
          const isMatching = matchingHeight?.hashesMatch;
          const heightExists = matchingHeight !== undefined;
          
          return (
            <MomentumCard
              key={momentum.height}
              momentum={momentum}
              isMatching={isMatching}
              heightExists={heightExists}
              isStale={momentum.is_stale}
            />
          );
        })}
      </Box>
    </Paper>
  );
};

function App() {
  const [nodeData, setNodeData] = useState({});
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/nodes');
        setNodeData(response.data);
      } catch (error) {
        console.error('Error fetching node data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        py: { xs: 4, md: 6 },
      }}
    >
      <Container maxWidth="lg">
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            textAlign: 'center',
            color: theme.palette.primary.main,
            mb: { xs: 4, md: 6 },
            fontSize: { xs: 32, md: 48 },
            fontWeight: 700,
            letterSpacing: '-0.03em',
          }}
        >
          Zenon Node Monitor
        </Typography>
        <Grid container spacing={4}>
          {Object.entries(nodeData).map(([nodeName, data]) => (
            <Grid item xs={12} md={4} key={nodeName}>
              <NodeCard nodeName={nodeName} data={data} allNodeData={nodeData} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default App; 