/**
 * Copyright (c) 2026, WSO2 LLC. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the
 * License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, {
    useReducer, useEffect, useState, useContext,
} from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { FormattedMessage } from 'react-intl';
import APIContext from 'AppComponents/Apis/Details/components/ApiContext';
import API from 'AppData/api';
import { isRestricted } from 'AppData/AuthManager';
import { usePublisherSettings } from 'AppComponents/Shared/AppContext';
import AdvanceEndpointConfig from './AdvancedConfig/AdvanceEndpointConfig';
import EndpointSecurity from './GeneralConfiguration/EndpointSecurity';

const MSG_PREFIX = 'Apis.Details.Endpoints.AddEditResourceEndpoint';

/**
 * Get color for test result status chip.
 * @param {object} result Test result object
 * @returns {string} Color string
 */
function getStatusColor(result) {
    if (result.isValid) return 'green';
    if (result.isError) return 'red';
    return '#ffd53a';
}

const DEFAULT_STATE = {
    name: '',
    endpoint_type: 'http',
    production_endpoints: { url: '' },
    sandbox_endpoints: { url: '' },
    production_failovers: [],
    sandbox_failovers: [],
    algoCombo: 'org.apache.synapse.endpoints.algorithms.RoundRobin',
    sessionManagement: '',
    sessionTimeOut: '',
    endpoint_security: {
        production: { enabled: false, type: 'NONE' },
        sandbox: { enabled: false, type: 'NONE' },
    },
    advancedConfig: {
        production: {},
        sandbox: {},
    },
};

/**
 * Convert endpoint data when switching between HTTP, Load Balance, and Failover types.
 *
 * @param {object} state Current state
 * @param {string} newType New endpoint type
 * @returns {object} Updated state with converted endpoint data
 */
function switchEndpointType(state, newType) {
    if (state.endpoint_type === newType) return state;
    const result = { ...state, endpoint_type: newType };

    if (newType === 'load_balance') {
        // Convert single endpoint to array format
        result.production_endpoints = Array.isArray(state.production_endpoints)
            ? state.production_endpoints
            : [state.production_endpoints || { url: '' }];
        result.sandbox_endpoints = Array.isArray(state.sandbox_endpoints)
            ? state.sandbox_endpoints
            : [state.sandbox_endpoints || { url: '' }];
        result.algoCombo = state.algoCombo || 'org.apache.synapse.endpoints.algorithms.RoundRobin';
        result.sessionManagement = state.sessionManagement || '';
        result.sessionTimeOut = state.sessionTimeOut || '';
        result.production_failovers = [];
        result.sandbox_failovers = [];
    } else if (newType === 'failover') {
        // Convert to primary + failovers format
        if (Array.isArray(state.production_endpoints)) {
            const [primary, ...rest] = state.production_endpoints;
            result.production_endpoints = primary || { url: '' };
            result.production_failovers = rest.length > 0 ? rest : (state.production_failovers || []);
        } else {
            result.production_endpoints = state.production_endpoints || { url: '' };
            result.production_failovers = state.production_failovers || [];
        }
        if (Array.isArray(state.sandbox_endpoints)) {
            const [primary, ...rest] = state.sandbox_endpoints;
            result.sandbox_endpoints = primary || { url: '' };
            result.sandbox_failovers = rest.length > 0 ? rest : (state.sandbox_failovers || []);
        } else {
            result.sandbox_endpoints = state.sandbox_endpoints || { url: '' };
            result.sandbox_failovers = state.sandbox_failovers || [];
        }
    } else {
        // HTTP - convert to single endpoint format
        result.production_endpoints = Array.isArray(state.production_endpoints)
            ? (state.production_endpoints[0] || { url: '' })
            : (state.production_endpoints || { url: '' });
        result.sandbox_endpoints = Array.isArray(state.sandbox_endpoints)
            ? (state.sandbox_endpoints[0] || { url: '' })
            : (state.sandbox_endpoints || { url: '' });
        result.production_failovers = [];
        result.sandbox_failovers = [];
    }
    return result;
}

function defReducer(state, action) {
    const { field, value, index, category } = action;
    switch (field) {
        case 'all':
            return { ...value };
        case 'name':
            return { ...state, name: value };
        case 'endpoint_type':
            return switchEndpointType(state, value);
        case 'production_url':
            return { ...state, production_endpoints: { ...state.production_endpoints, url: value } };
        case 'sandbox_url':
            return { ...state, sandbox_endpoints: { ...state.sandbox_endpoints, url: value } };
        case 'lb_url': {
            const key = category === 'production' ? 'production_endpoints' : 'sandbox_endpoints';
            const eps = [...(state[key] || [])];
            eps[index] = { ...eps[index], url: value };
            return { ...state, [key]: eps };
        }
        case 'add_lb_endpoint': {
            const key = category === 'production' ? 'production_endpoints' : 'sandbox_endpoints';
            return { ...state, [key]: [...(state[key] || []), { url: '' }] };
        }
        case 'remove_lb_endpoint': {
            const key = category === 'production' ? 'production_endpoints' : 'sandbox_endpoints';
            const eps = [...(state[key] || [])];
            eps.splice(index, 1);
            return { ...state, [key]: eps };
        }
        case 'failover_url': {
            const key = category === 'production' ? 'production_failovers' : 'sandbox_failovers';
            const eps = [...(state[key] || [])];
            eps[index] = { ...eps[index], url: value };
            return { ...state, [key]: eps };
        }
        case 'add_failover': {
            const key = category === 'production' ? 'production_failovers' : 'sandbox_failovers';
            return { ...state, [key]: [...(state[key] || []), { url: '' }] };
        }
        case 'remove_failover': {
            const key = category === 'production' ? 'production_failovers' : 'sandbox_failovers';
            const eps = [...(state[key] || [])];
            eps.splice(index, 1);
            return { ...state, [key]: eps };
        }
        case 'algoCombo':
            return { ...state, algoCombo: value };
        case 'sessionManagement':
            return { ...state, sessionManagement: value };
        case 'sessionTimeOut':
            return { ...state, sessionTimeOut: value };
        case 'advancedConfig':
            return { ...state, advancedConfig: { ...state.advancedConfig, ...value } };
        case 'endpoint_security':
            return { ...state, endpoint_security: { ...state.endpoint_security, ...value } };
        default:
            return state;
    }
}

/**
 * Dialog for creating or editing a resource endpoint definition.
 * Supports HTTP, Load Balance, and Failover endpoint types with
 * test endpoint, advanced configuration, and security features.
 *
 * @param {object} props Component props
 * @returns {JSX.Element} Dialog component
 */
export default function AddEditResourceEndpoint(props) {
    const {
        open,
        onClose,
        definition,
        existingNames,
        onSave,
    } = props;

    const { api } = useContext(APIContext);
    const { data: publisherSettings } = usePublisherSettings();
    const isEditing = !!definition;

    const [state, dispatch] = useReducer(defReducer, { ...DEFAULT_STATE });
    const [validating, setValidating] = useState(false);
    const [prodEnabled, setProdEnabled] = useState(true);
    const [sandEnabled, setSandEnabled] = useState(true);

    // Test endpoint states (keyed by URL identifier)
    const [testResults, setTestResults] = useState({});
    const [testingUrls, setTestingUrls] = useState({});

    // Advanced config dialog state
    const [advConfigOpen, setAdvConfigOpen] = useState(false);
    const [advConfigCategory, setAdvConfigCategory] = useState('production');

    // Endpoint security dialog state
    const [securityOpen, setSecurityOpen] = useState(false);
    const [securityCategory, setSecurityCategory] = useState('production');

    // Get endpoint security types from publisher settings
    const endpointSecurityTypes = (() => {
        if (!publisherSettings) return [];
        try {
            const gwType = api.gatewayType || 'wso2/synapse';
            return publisherSettings.gatewayFeatureCatalog
                .gatewayFeatures[gwType].endpointSecurity || [];
        } catch (e) {
            return [];
        }
    })();

    // Initialize form when dialog opens
    useEffect(() => {
        if (open) {
            if (definition) {
                dispatch({
                    field: 'all',
                    value: { ...DEFAULT_STATE, ...definition },
                });
                // Determine if production/sandbox are enabled
                const epType = definition.endpoint_type || 'http';
                if (epType === 'load_balance') {
                    const prodEps = definition.production_endpoints;
                    const sandEps = definition.sandbox_endpoints;
                    setProdEnabled(Array.isArray(prodEps) && prodEps.length > 0 && prodEps[0].url !== '');
                    setSandEnabled(Array.isArray(sandEps) && sandEps.length > 0 && sandEps[0].url !== '');
                } else {
                    setProdEnabled(!!definition.production_endpoints?.url);
                    setSandEnabled(!!definition.sandbox_endpoints?.url);
                }
            } else {
                dispatch({ field: 'all', value: { ...DEFAULT_STATE } });
                setProdEnabled(true);
                setSandEnabled(true);
            }
            setValidating(false);
            setTestResults({});
            setTestingUrls({});
            setAdvConfigOpen(false);
            setSecurityOpen(false);
        }
    }, [open, definition]);

    // ----- Validation -----
    const nameExists = () => {
        if (!state.name) return false;
        const current = definition?.name || '';
        return existingNames
            .filter((n) => n !== current)
            .some((n) => n.toLowerCase() === state.name.toLowerCase());
    };

    const hasEndpointUrl = (category) => {
        const epType = state.endpoint_type;
        if (category === 'production') {
            if (epType === 'load_balance') {
                const eps = state.production_endpoints;
                return Array.isArray(eps) && eps.some((ep) => ep.url && ep.url.trim());
            }
            return state.production_endpoints?.url?.trim();
        }
        if (epType === 'load_balance') {
            const eps = state.sandbox_endpoints;
            return Array.isArray(eps) && eps.some((ep) => ep.url && ep.url.trim());
        }
        return state.sandbox_endpoints?.url?.trim();
    };

    const hasErrors = () => {
        if (!state.name.trim()) return true;
        if (nameExists()) return true;
        if (!prodEnabled && !sandEnabled) return true;
        const hasProdUrl = prodEnabled ? hasEndpointUrl('production') : false;
        const hasSandUrl = sandEnabled ? hasEndpointUrl('sandbox') : false;
        if (!hasProdUrl && !hasSandUrl) return true;
        return false;
    };

    // ----- Save -----
    const handleSave = () => {
        setValidating(true);
        if (hasErrors()) return;

        const result = { ...state };
        if (!prodEnabled) {
            if (state.endpoint_type === 'load_balance') {
                result.production_endpoints = [];
            } else {
                result.production_endpoints = { url: '' };
            }
            result.production_failovers = [];
        }
        if (!sandEnabled) {
            if (state.endpoint_type === 'load_balance') {
                result.sandbox_endpoints = [];
            } else {
                result.sandbox_endpoints = { url: '' };
            }
            result.sandbox_failovers = [];
        }
        if (definition?.id) {
            result.id = definition.id;
        }
        onSave(result);
    };

    // ----- Test Endpoint -----
    const testEndpoint = (url, urlKey) => {
        if (!url) return;
        setTestingUrls((prev) => ({ ...prev, [urlKey]: true }));
        const restApi = new API();
        restApi.testEndpoint(url, api.id)
            .then((result) => {
                if (result.body.error !== null) {
                    setTestResults((prev) => ({
                        ...prev,
                        [urlKey]: {
                            statusCode: result.body.error,
                            isError: true,
                            isValid: false,
                        },
                    }));
                } else {
                    const code = result.body.statusCode;
                    setTestResults((prev) => ({
                        ...prev,
                        [urlKey]: {
                            statusCode: code + ' ' + result.body.statusMessage,
                            isError: false,
                            isValid: code >= 200 && code < 300,
                        },
                    }));
                }
            })
            .finally(() => {
                setTestingUrls((prev) => ({ ...prev, [urlKey]: false }));
            });
    };

    // ----- Advanced Config -----
    const openAdvanceConfig = (category) => {
        setAdvConfigCategory(category);
        setAdvConfigOpen(true);
    };

    const saveAdvanceConfig = (config) => {
        dispatch({
            field: 'advancedConfig',
            value: { [advConfigCategory]: config },
        });
        setAdvConfigOpen(false);
    };

    // ----- Endpoint Security -----
    const openSecurityConfig = (category) => {
        setSecurityCategory(category);
        setSecurityOpen(true);
    };

    const saveSecurityConfig = (securityObj) => {
        const key = securityCategory === 'production' ? 'production' : 'sandbox';
        dispatch({
            field: 'endpoint_security',
            value: { [key]: securityObj },
        });
        setSecurityOpen(false);
    };

    // ----- Render endpoint adornment icons -----
    const renderEndpointAdornment = (url, urlKey, category) => {
        const testResult = testResults[urlKey];
        const isTesting = testingUrls[urlKey];
        const restricted = isRestricted(['apim:api_create'], api);

        return (
            <InputAdornment position='end'>
                {testResult && (
                    <Chip
                        label={testResult.statusCode}
                        variant='outlined'
                        size='small'
                        sx={{
                            mr: 0.5,
                            color: getStatusColor(testResult),
                            borderColor: getStatusColor(testResult),
                        }}
                    />
                )}
                <IconButton
                    size='small'
                    onClick={() => testEndpoint(url, urlKey)}
                    disabled={restricted || isTesting || !url}
                >
                    {isTesting ? (
                        <CircularProgress size={18} />
                    ) : (
                        <Tooltip title={(
                            <FormattedMessage
                                id={MSG_PREFIX + '.testEndpoint'}
                                defaultMessage='Check endpoint status'
                            />
                        )}
                        >
                            <CheckCircleIcon
                                fontSize='small'
                                sx={testResult?.isValid ? { color: 'green' } : {}}
                            />
                        </Tooltip>
                    )}
                </IconButton>
                <IconButton
                    size='small'
                    onClick={() => openAdvanceConfig(category)}
                    disabled={restricted}
                >
                    <Tooltip title={(
                        <FormattedMessage
                            id={MSG_PREFIX + '.advConfig'}
                            defaultMessage='Endpoint configurations'
                        />
                    )}
                    >
                        <SettingsIcon fontSize='small' />
                    </Tooltip>
                </IconButton>
                <IconButton
                    size='small'
                    onClick={() => openSecurityConfig(category)}
                    disabled={restricted}
                >
                    <Tooltip title={(
                        <FormattedMessage
                            id={MSG_PREFIX + '.security'}
                            defaultMessage='Endpoint security'
                        />
                    )}
                    >
                        <SecurityIcon fontSize='small' />
                    </Tooltip>
                </IconButton>
            </InputAdornment>
        );
    };

    // ----- Render URL fields for different endpoint types -----

    /** Render a single URL field (HTTP or Failover primary) */
    const renderSingleUrlField = (category, label) => {
        const isProd = category === 'production';
        const urlValue = isProd
            ? (state.production_endpoints?.url || '')
            : (state.sandbox_endpoints?.url || '');
        const urlKey = category + '-primary';
        const enabled = isProd ? prodEnabled : sandEnabled;
        const urlMissing = validating && enabled && !urlValue.trim()
            && !(isProd ? false : hasEndpointUrl('production'))
            && !(isProd ? hasEndpointUrl('sandbox') : false);

        return (
            <TextField
                label={label}
                value={urlValue}
                onChange={(e) => dispatch({
                    field: isProd ? 'production_url' : 'sandbox_url',
                    value: e.target.value,
                })}
                fullWidth
                variant='outlined'
                placeholder='http://appserver/resource'
                required
                error={validating && enabled && !urlValue.trim()}
                helperText={
                    urlMissing && (
                        <FormattedMessage
                            id={MSG_PREFIX + '.urlRequired'}
                            defaultMessage='Endpoint URL should not be empty'
                        />
                    )
                }
                sx={{ mt: 1 }}
                InputProps={{
                    endAdornment: renderEndpointAdornment(urlValue, urlKey, category),
                }}
            />
        );
    };

    /** Render Load Balance URL fields (multiple endpoints with add/remove) */
    const renderLoadBalanceUrls = (category) => {
        const isProd = category === 'production';
        const endpoints = isProd ? state.production_endpoints : state.sandbox_endpoints;
        const epList = Array.isArray(endpoints) ? endpoints : [endpoints || { url: '' }];

        return (
            <Box sx={{ mt: 1 }}>
                {epList.map((ep, idx) => {
                    const urlKey = category + '-lb-' + idx;
                    return (
                        <Box key={urlKey} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                            <TextField
                                label={idx === 0 ? (
                                    <FormattedMessage
                                        id={MSG_PREFIX + '.primaryEndpoint'}
                                        defaultMessage='Primary Endpoint'
                                    />
                                ) : (
                                    <FormattedMessage
                                        id={MSG_PREFIX + '.endpointN'}
                                        defaultMessage='Endpoint {n}'
                                        values={{ n: idx + 1 }}
                                    />
                                )}
                                value={ep.url || ''}
                                onChange={(e) => dispatch({
                                    field: 'lb_url',
                                    value: e.target.value,
                                    index: idx,
                                    category,
                                })}
                                fullWidth
                                variant='outlined'
                                placeholder='http://appserver/resource'
                                required={idx === 0}
                                error={validating && idx === 0 && !ep.url?.trim()}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position='end'>
                                            {testResults[urlKey] && (
                                                <Chip
                                                    label={testResults[urlKey].statusCode}
                                                    variant='outlined'
                                                    size='small'
                                                    sx={{
                                                        mr: 0.5,
                                                        color: getStatusColor(testResults[urlKey]),
                                                        borderColor: getStatusColor(testResults[urlKey]),
                                                    }}
                                                />
                                            )}
                                            <IconButton
                                                size='small'
                                                onClick={() => testEndpoint(ep.url, urlKey)}
                                                disabled={!ep.url || testingUrls[urlKey]}
                                            >
                                                {testingUrls[urlKey] ? (
                                                    <CircularProgress size={18} />
                                                ) : (
                                                    <Tooltip title={(
                                                        <FormattedMessage
                                                            id={MSG_PREFIX + '.testEndpoint'}
                                                            defaultMessage='Check endpoint status'
                                                        />
                                                    )}
                                                    >
                                                        <CheckCircleIcon
                                                            fontSize='small'
                                                            sx={testResults[urlKey]?.isValid ? { color: 'green' } : {}}
                                                        />
                                                    </Tooltip>
                                                )}
                                            </IconButton>
                                            {idx > 0 && (
                                                <IconButton
                                                    size='small'
                                                    color='error'
                                                    onClick={() => dispatch({
                                                        field: 'remove_lb_endpoint',
                                                        index: idx,
                                                        category,
                                                    })}
                                                >
                                                    <DeleteIcon fontSize='small' />
                                                </IconButton>
                                            )}
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    );
                })}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
                >
                    <Button
                        size='small'
                        startIcon={<AddCircleIcon />}
                        onClick={() => dispatch({
                            field: 'add_lb_endpoint',
                            category,
                        })}
                    >
                        <FormattedMessage
                            id={MSG_PREFIX + '.addEndpoint'}
                            defaultMessage='Add Endpoint'
                        />
                    </Button>
                    <Box>
                        <IconButton
                            size='small'
                            onClick={() => openAdvanceConfig(category)}
                        >
                            <Tooltip title={(
                                <FormattedMessage
                                    id={MSG_PREFIX + '.advConfig'}
                                    defaultMessage='Endpoint configurations'
                                />
                            )}
                            >
                                <SettingsIcon fontSize='small' />
                            </Tooltip>
                        </IconButton>
                        <IconButton
                            size='small'
                            onClick={() => openSecurityConfig(category)}
                        >
                            <Tooltip title={(
                                <FormattedMessage
                                    id={MSG_PREFIX + '.security'}
                                    defaultMessage='Endpoint security'
                                />
                            )}
                            >
                                <SecurityIcon fontSize='small' />
                            </Tooltip>
                        </IconButton>
                    </Box>
                </Box>
            </Box>
        );
    };

    /** Render Failover URL fields (primary + failover endpoints with add/remove) */
    const renderFailoverUrls = (category) => {
        const isProd = category === 'production';
        const failovers = isProd ? (state.production_failovers || []) : (state.sandbox_failovers || []);

        return (
            <Box sx={{ mt: 1 }}>
                {/* Primary endpoint */}
                {renderSingleUrlField(
                    category,
                    <FormattedMessage
                        id={MSG_PREFIX + '.primaryEndpoint'}
                        defaultMessage='Primary Endpoint'
                    />,
                )}

                {/* Failover endpoints */}
                {failovers.length > 0 && (
                    <Typography variant='body2' color='textSecondary' sx={{ mt: 2, mb: 1 }}>
                        <FormattedMessage
                            id={MSG_PREFIX + '.failoverEndpoints'}
                            defaultMessage='Failover Endpoints'
                        />
                    </Typography>
                )}
                {failovers.map((ep, idx) => {
                    const urlKey = category + '-failover-' + idx;
                    return (
                        <Box key={urlKey} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                            <TextField
                                label={(
                                    <FormattedMessage
                                        id={MSG_PREFIX + '.failoverN'}
                                        defaultMessage='Failover {n}'
                                        values={{ n: idx + 1 }}
                                    />
                                )}
                                value={ep.url || ''}
                                onChange={(e) => dispatch({
                                    field: 'failover_url',
                                    value: e.target.value,
                                    index: idx,
                                    category,
                                })}
                                fullWidth
                                variant='outlined'
                                placeholder='http://appserver/resource'
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position='end'>
                                            {testResults[urlKey] && (
                                                <Chip
                                                    label={testResults[urlKey].statusCode}
                                                    variant='outlined'
                                                    size='small'
                                                    sx={{
                                                        mr: 0.5,
                                                        color: getStatusColor(testResults[urlKey]),
                                                        borderColor: getStatusColor(testResults[urlKey]),
                                                    }}
                                                />
                                            )}
                                            <IconButton
                                                size='small'
                                                onClick={() => testEndpoint(ep.url, urlKey)}
                                                disabled={!ep.url || testingUrls[urlKey]}
                                            >
                                                {testingUrls[urlKey] ? (
                                                    <CircularProgress size={18} />
                                                ) : (
                                                    <Tooltip title={(
                                                        <FormattedMessage
                                                            id={MSG_PREFIX + '.testEndpoint'}
                                                            defaultMessage='Check endpoint status'
                                                        />
                                                    )}
                                                    >
                                                        <CheckCircleIcon
                                                            fontSize='small'
                                                            sx={testResults[urlKey]?.isValid ? { color: 'green' } : {}}
                                                        />
                                                    </Tooltip>
                                                )}
                                            </IconButton>
                                            <IconButton
                                                size='small'
                                                color='error'
                                                onClick={() => dispatch({
                                                    field: 'remove_failover',
                                                    index: idx,
                                                    category,
                                                })}
                                            >
                                                <DeleteIcon fontSize='small' />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>
                    );
                })}
                <Button
                    size='small'
                    startIcon={<AddCircleIcon />}
                    onClick={() => dispatch({ field: 'add_failover', category })}
                    sx={{ mt: 1 }}
                >
                    <FormattedMessage
                        id={MSG_PREFIX + '.addFailover'}
                        defaultMessage='Add Failover Endpoint'
                    />
                </Button>
            </Box>
        );
    };

    /** Render the URL section based on endpoint type */
    const renderUrlSection = (category) => {
        const epType = state.endpoint_type;
        if (epType === 'load_balance') {
            return renderLoadBalanceUrls(category);
        }
        if (epType === 'failover') {
            return renderFailoverUrls(category);
        }
        // Default: HTTP single endpoint
        if (category === 'production') {
            return renderSingleUrlField(
                category,
                <FormattedMessage id={MSG_PREFIX + '.prodUrl'} defaultMessage='Production Endpoint' />,
            );
        }
        return renderSingleUrlField(
            category,
            <FormattedMessage id={MSG_PREFIX + '.sandUrl'} defaultMessage='Sandbox Endpoint' />,
        );
    };

    const noEndpointEnabled = validating && !prodEnabled && !sandEnabled;

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth='md'
                fullWidth
            >
                <DialogTitle>
                    {isEditing ? (
                        <FormattedMessage id={MSG_PREFIX + '.titleEdit'} defaultMessage='Edit Endpoint Definition' />
                    ) : (
                        <FormattedMessage id={MSG_PREFIX + '.titleAdd'} defaultMessage='Add Endpoint Definition' />
                    )}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        {/* Name */}
                        <Grid item xs={6}>
                            <TextField
                                label={<FormattedMessage id={MSG_PREFIX + '.name'} defaultMessage='Name' />}
                                value={state.name}
                                onChange={(e) => dispatch({ field: 'name', value: e.target.value })}
                                fullWidth
                                variant='outlined'
                                required
                                error={(validating && !state.name.trim()) || nameExists()}
                                helperText={
                                    nameExists() ? (
                                        <FormattedMessage
                                            id={MSG_PREFIX + '.nameExists'}
                                            defaultMessage='A definition with this name already exists'
                                        />
                                    ) : (validating && !state.name.trim() && (
                                        <FormattedMessage
                                            id={MSG_PREFIX + '.nameReq'}
                                            defaultMessage='Name is required'
                                        />
                                    ))
                                }
                            />
                        </Grid>

                        {/* Endpoint Type */}
                        <Grid item xs={6}>
                            <FormControl fullWidth variant='outlined'>
                                <InputLabel>
                                    <FormattedMessage
                                        id={MSG_PREFIX + '.endpointType'}
                                        defaultMessage='Endpoint Type'
                                    />
                                </InputLabel>
                                <Select
                                    value={state.endpoint_type || 'http'}
                                    onChange={(e) => dispatch({
                                        field: 'endpoint_type',
                                        value: e.target.value,
                                    })}
                                    label='Endpoint Type'
                                >
                                    <MenuItem value='http'>
                                        <FormattedMessage
                                            id={MSG_PREFIX + '.typeHttp'}
                                            defaultMessage='HTTP Endpoint'
                                        />
                                    </MenuItem>
                                    <MenuItem value='load_balance'>
                                        <FormattedMessage
                                            id={MSG_PREFIX + '.typeLb'}
                                            defaultMessage='Load Balanced'
                                        />
                                    </MenuItem>
                                    <MenuItem value='failover'>
                                        <FormattedMessage
                                            id={MSG_PREFIX + '.typeFailover'}
                                            defaultMessage='Failover'
                                        />
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Load Balance Algorithm Selector */}
                        {state.endpoint_type === 'load_balance' && (
                            <>
                                <Grid item xs={6}>
                                    <FormControl fullWidth variant='outlined'>
                                        <InputLabel>
                                            <FormattedMessage
                                                id={MSG_PREFIX + '.algorithm'}
                                                defaultMessage='Load Balance Algorithm'
                                            />
                                        </InputLabel>
                                        <Select
                                            value={
                                                state.algoCombo
                                                || 'org.apache.synapse.endpoints.algorithms.RoundRobin'
                                            }
                                            onChange={(e) => dispatch({
                                                field: 'algoCombo',
                                                value: e.target.value,
                                            })}
                                            label='Load Balance Algorithm'
                                        >
                                            <MenuItem value='org.apache.synapse.endpoints.algorithms.RoundRobin'>
                                                <FormattedMessage
                                                    id={MSG_PREFIX + '.algoRoundRobin'}
                                                    defaultMessage='Round Robin'
                                                />
                                            </MenuItem>
                                            <MenuItem value='other'>
                                                <FormattedMessage
                                                    id={MSG_PREFIX + '.algoOther'}
                                                    defaultMessage='Other'
                                                />
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={3}>
                                    <FormControl fullWidth variant='outlined'>
                                        <InputLabel>
                                            <FormattedMessage
                                                id={MSG_PREFIX + '.sessionMgmt'}
                                                defaultMessage='Session Management'
                                            />
                                        </InputLabel>
                                        <Select
                                            value={state.sessionManagement || ''}
                                            onChange={(e) => dispatch({
                                                field: 'sessionManagement',
                                                value: e.target.value,
                                            })}
                                            label='Session Management'
                                        >
                                            <MenuItem value=''>
                                                <FormattedMessage
                                                    id={MSG_PREFIX + '.sessionNone'}
                                                    defaultMessage='None'
                                                />
                                            </MenuItem>
                                            <MenuItem value='transport'>
                                                <FormattedMessage
                                                    id={MSG_PREFIX + '.sessionTransport'}
                                                    defaultMessage='Transport'
                                                />
                                            </MenuItem>
                                            <MenuItem value='soap'>
                                                <FormattedMessage
                                                    id={MSG_PREFIX + '.sessionSoap'}
                                                    defaultMessage='SOAP'
                                                />
                                            </MenuItem>
                                            <MenuItem value='simpleClientSession'>
                                                <FormattedMessage
                                                    id={MSG_PREFIX + '.sessionClient'}
                                                    defaultMessage='Client ID'
                                                />
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={3}>
                                    <TextField
                                        label={(
                                            <FormattedMessage
                                                id={MSG_PREFIX + '.sessionTimeout'}
                                                defaultMessage='Session Timeout (ms)'
                                            />
                                        )}
                                        value={state.sessionTimeOut || ''}
                                        onChange={(e) => dispatch({ field: 'sessionTimeOut', value: e.target.value })}
                                        fullWidth
                                        variant='outlined'
                                        type='number'
                                    />
                                </Grid>
                            </>
                        )}

                        <Grid item xs={12}><Divider /></Grid>

                        {/* Production Endpoint Section */}
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={(
                                    <Checkbox
                                        checked={prodEnabled}
                                        color='primary'
                                        onChange={(e) => setProdEnabled(e.target.checked)}
                                    />
                                )}
                                label={(
                                    <Typography variant='subtitle1'>
                                        <FormattedMessage
                                            id={MSG_PREFIX + '.prodSection'}
                                            defaultMessage='Production Endpoint'
                                        />
                                    </Typography>
                                )}
                            />
                            <Collapse in={prodEnabled}>
                                {renderUrlSection('production')}
                            </Collapse>
                        </Grid>

                        {/* Sandbox Endpoint Section */}
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={(
                                    <Checkbox
                                        checked={sandEnabled}
                                        color='primary'
                                        onChange={(e) => setSandEnabled(e.target.checked)}
                                    />
                                )}
                                label={(
                                    <Typography variant='subtitle1'>
                                        <FormattedMessage
                                            id={MSG_PREFIX + '.sandSection'}
                                            defaultMessage='Sandbox Endpoint'
                                        />
                                    </Typography>
                                )}
                            />
                            <Collapse in={sandEnabled}>
                                {renderUrlSection('sandbox')}
                            </Collapse>
                        </Grid>

                        {/* Validation messages */}
                        {noEndpointEnabled && (
                            <Grid item xs={12}>
                                <Typography variant='caption' color='error'>
                                    <FormattedMessage
                                        id={MSG_PREFIX + '.enableOne'}
                                        defaultMessage='Enable at least one endpoint type (production or sandbox).'
                                    />
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>
                        <FormattedMessage id={MSG_PREFIX + '.cancel'} defaultMessage='Cancel' />
                    </Button>
                    <Button variant='contained' color='primary' onClick={handleSave}>
                        {isEditing ? (
                            <FormattedMessage id={MSG_PREFIX + '.update'} defaultMessage='Update' />
                        ) : (
                            <FormattedMessage id={MSG_PREFIX + '.create'} defaultMessage='Create' />
                        )}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Nested Dialog: Advanced Endpoint Configuration */}
            <Dialog
                open={advConfigOpen}
                onClose={() => setAdvConfigOpen(false)}
                maxWidth='md'
                fullWidth
            >
                <DialogTitle>
                    <Typography variant='h6'>
                        <FormattedMessage
                            id={MSG_PREFIX + '.advConfigTitle'}
                            defaultMessage='Advanced Configurations'
                        />
                        {' - '}
                        {advConfigCategory === 'production' ? (
                            <FormattedMessage id={MSG_PREFIX + '.production'} defaultMessage='Production' />
                        ) : (
                            <FormattedMessage id={MSG_PREFIX + '.sandbox'} defaultMessage='Sandbox' />
                        )}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <AdvanceEndpointConfig
                        advanceConfig={state.advancedConfig?.[advConfigCategory] || {}}
                        isSOAPEndpoint={false}
                        onSaveAdvanceConfig={saveAdvanceConfig}
                        onCancel={() => setAdvConfigOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Nested Dialog: Endpoint Security Configuration */}
            <Dialog
                open={securityOpen}
                onClose={() => setSecurityOpen(false)}
                maxWidth='md'
                fullWidth
            >
                <DialogTitle>
                    <Typography variant='h6'>
                        <FormattedMessage
                            id={MSG_PREFIX + '.securityTitle'}
                            defaultMessage='Endpoint Security'
                        />
                        {' - '}
                        {securityCategory === 'production' ? (
                            <FormattedMessage id={MSG_PREFIX + '.production'} defaultMessage='Production' />
                        ) : (
                            <FormattedMessage id={MSG_PREFIX + '.sandbox'} defaultMessage='Sandbox' />
                        )}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <EndpointSecurity
                        securityInfo={state.endpoint_security?.[securityCategory] || { type: 'NONE' }}
                        isProduction={securityCategory === 'production'}
                        saveEndpointSecurityConfig={saveSecurityConfig}
                        closeEndpointSecurityConfig={() => setSecurityOpen(false)}
                        endpointSecurityTypes={endpointSecurityTypes}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

AddEditResourceEndpoint.defaultProps = {
    definition: null,
};

AddEditResourceEndpoint.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    definition: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        endpoint_type: PropTypes.string,
        production_endpoints: PropTypes.oneOfType([
            PropTypes.shape({ url: PropTypes.string }),
            PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string })),
        ]),
        sandbox_endpoints: PropTypes.oneOfType([
            PropTypes.shape({ url: PropTypes.string }),
            PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string })),
        ]),
        production_failovers: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string })),
        sandbox_failovers: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string })),
    }),
    existingNames: PropTypes.arrayOf(PropTypes.string).isRequired,
    onSave: PropTypes.func.isRequired,
};
