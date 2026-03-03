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
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { FormattedMessage } from 'react-intl';
import { Link, useHistory } from 'react-router-dom';
import { APIContext } from 'AppComponents/Apis/Details/components/ApiContext';
import { usePublisherSettings } from 'AppComponents/Shared/AppContext';
import { getBasePath } from 'AppComponents/Shared/Utils';
import API from 'AppData/api';
import CONSTS from 'AppData/Constants';
import Alert from 'AppComponents/Shared/Alert';
import { isRestricted } from 'AppData/AuthManager';
import InlineMessage from 'AppComponents/Shared/InlineMessage';
import LaunchIcon from '@mui/icons-material/Launch';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import ServiceCatalog from 'AppData/ServiceCatalog';
import AdvanceEndpointConfig from '../AdvancedConfig/AdvanceEndpointConfig';
import EndpointSecurity from '../GeneralConfiguration/EndpointSecurity';
import GeneralConfiguration from '../GeneralConfiguration';
import Credentials from '../AWSLambda/Credentials';
import CustomBackend from '../CustomBackend';
import GenericEndpoint from '../GenericEndpoint';
import ServiceEndpoint from '../ServiceEndpoint';
import MockImplEndpoints from '../Prototype/MockImplEndpoints';

const DEFS_KEY = 'x-wso2-resource-endpoint-definitions';
const PRIMARY_KEY = 'x-wso2-primary-endpoint-ref';
const MSG_PREFIX = 'Apis.Details.Endpoints.ResourceEndpoints.AddEditResourceEndpoint';

const PREFIX = 'AddEditResourceEndpoint';

const classes = {
    root: `${PREFIX}-root`,
    titleWrapper: `${PREFIX}-titleWrapper`,
    titleLink: `${PREFIX}-titleLink`,
    actionButtonSection: `${PREFIX}-actionButtonSection`,
};

const StyledGrid = styled(Grid)(({ theme }) => ({
    [`& .${classes.root}`]: {
        padding: 20,
    },
    [`& .${classes.titleWrapper}`]: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing(3),
    },
    [`& .${classes.titleLink}`]: {
        color: theme.palette.primary.main,
        marginRight: theme.spacing(1),
    },
    [`& .${classes.actionButtonSection}`]: {
        marginTop: theme.spacing(3),
    },
}));

function generateId() {
    return 'ep-'
        + Date.now().toString(36)
        + Math.random().toString(36).substr(2, 9);
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
};

function switchEndpointType(state, newType) {
    if (state.endpoint_type === newType) return state;
    const result = { ...state, endpoint_type: newType };

    if (newType === 'load_balance') {
        result.production_endpoints = Array.isArray(state.production_endpoints)
            ? state.production_endpoints
            : [state.production_endpoints || { url: '' }];
        result.sandbox_endpoints = Array.isArray(state.sandbox_endpoints)
            ? state.sandbox_endpoints
            : [state.sandbox_endpoints || { url: '' }];
        result.algoCombo = state.algoCombo
            || 'org.apache.synapse.endpoints.algorithms.RoundRobin';
        result.production_failovers = [];
        result.sandbox_failovers = [];
    } else if (newType === 'failover') {
        if (Array.isArray(state.production_endpoints)) {
            const [primary, ...rest] = state.production_endpoints;
            result.production_endpoints = primary || { url: '' };
            result.production_failovers = rest.length > 0
                ? rest : (state.production_failovers || []);
        } else {
            result.production_endpoints = state.production_endpoints
                || { url: '' };
            result.production_failovers = state.production_failovers || [];
        }
        if (Array.isArray(state.sandbox_endpoints)) {
            const [primary, ...rest] = state.sandbox_endpoints;
            result.sandbox_endpoints = primary || { url: '' };
            result.sandbox_failovers = rest.length > 0
                ? rest : (state.sandbox_failovers || []);
        } else {
            result.sandbox_endpoints = state.sandbox_endpoints
                || { url: '' };
            result.sandbox_failovers = state.sandbox_failovers || [];
        }
    } else {
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
    const {
        field, value, index, category,
    } = action;
    switch (field) {
        case 'all':
            return { ...value };
        case 'name':
            return { ...state, name: value };
        case 'endpoint_type':
            return switchEndpointType(state, value);
        case 'production_url':
            return {
                ...state,
                production_endpoints: {
                    ...state.production_endpoints, url: value,
                },
            };
        case 'sandbox_url':
            return {
                ...state,
                sandbox_endpoints: {
                    ...state.sandbox_endpoints, url: value,
                },
            };
        case 'lb_url': {
            const key = category === 'production'
                ? 'production_endpoints' : 'sandbox_endpoints';
            const eps = [...(state[key] || [])];
            eps[index] = { ...eps[index], url: value };
            return { ...state, [key]: eps };
        }
        case 'add_lb_endpoint': {
            const key = category === 'production'
                ? 'production_endpoints' : 'sandbox_endpoints';
            return {
                ...state,
                [key]: [...(state[key] || []), { url: '' }],
            };
        }
        case 'remove_lb_endpoint': {
            const key = category === 'production'
                ? 'production_endpoints' : 'sandbox_endpoints';
            const eps = [...(state[key] || [])];
            eps.splice(index, 1);
            return { ...state, [key]: eps };
        }
        case 'failover_url': {
            const key = category === 'production'
                ? 'production_failovers' : 'sandbox_failovers';
            const eps = [...(state[key] || [])];
            eps[index] = { ...eps[index], url: value };
            return { ...state, [key]: eps };
        }
        case 'add_failover': {
            const key = category === 'production'
                ? 'production_failovers' : 'sandbox_failovers';
            return {
                ...state,
                [key]: [...(state[key] || []), { url: '' }],
            };
        }
        case 'remove_failover': {
            const key = category === 'production'
                ? 'production_failovers' : 'sandbox_failovers';
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
            return {
                ...state,
                advancedConfig: { ...state.advancedConfig, ...value },
            };
        case 'endpoint_security':
            return {
                ...state,
                endpoint_security: {
                    ...state.endpoint_security, ...value,
                },
            };
        case 'access_method':
            return { ...state, access_method: value };
        case 'amznAccessKey':
            return { ...state, amznAccessKey: value };
        case 'amznSecretKey':
            return { ...state, amznSecretKey: value };
        case 'amznRegion':
            return { ...state, amznRegion: value };
        default:
            return state;
    }
}

/**
 * Full-page component for creating or editing a resource
 * endpoint definition. Follows the AI Endpoints page pattern.
 *
 * @param {object} props Component props
 * @returns {JSX.Element} Page component
 */
export default function AddEditResourceEndpoint(props) {
    const { match } = props;
    const endpointId = match?.params?.id;
    const isEditing = !!endpointId;

    const { api } = useContext(APIContext);
    const { data: publisherSettings } = usePublisherSettings();
    const history = useHistory();
    const urlPrefix = getBasePath(api.apiType);
    const endpointsUrl = urlPrefix + api.id + '/endpoints';

    const [state, dispatch] = useReducer(defReducer, { ...DEFAULT_STATE });
    const [swagger, setSwagger] = useState(null);
    const [existingNames, setExistingNames] = useState([]);
    const [validating, setValidating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deploymentStage, setDeploymentStage] = useState('production');

    // Advanced config dialog state
    const [advConfigOpen, setAdvConfigOpen] = useState(false);
    const [advConfigCategory, setAdvConfigCategory] = useState('production');

    // Endpoint security dialog state
    const [securityOpen, setSecurityOpen] = useState(false);
    const [securityCategory, setSecurityCategory] = useState('production');

    // Sequence Backend state
    const [prodBackendList, setProdBackendList] = useState([]);
    const [sandBackendList, setSandBackendList] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [isValidSeqBackend, setIsValidSeqBackend] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [isCustomBackend, setIsCustomBackend] = useState(false);

    // Service catalog state
    const [servicesList, setServicesList] = useState([]);

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

    // Load swagger and populate form
    useEffect(() => {
        const restApi = new API();
        restApi.getSwagger(api.id).then((response) => {
            const swaggerDoc = response.body;
            setSwagger(swaggerDoc);
            const defs = swaggerDoc[DEFS_KEY] || [];
            setExistingNames(defs.map((d) => d.name));

            if (isEditing) {
                const def = defs.find((d) => d.id === endpointId);
                if (def) {
                    // Server wraps config in endpointConfig
                    const cfg = def.endpointConfig || {};
                    dispatch({
                        field: 'all',
                        value: {
                            ...DEFAULT_STATE,
                            ...def,
                            ...cfg,
                        },
                    });
                }
            }
        });
    }, [api.id, endpointId]);

    // Fetch services when Service type selected
    useEffect(() => {
        if (state.endpoint_type === 'service') {
            ServiceCatalog.getServiceList().then((resp) => {
                setServicesList(resp.list || []);
            }).catch(() => {
                setServicesList([]);
            });
        }
    }, [state.endpoint_type]);

    // Service selection callback
    // ServiceEndpoint calls editService(value) with full
    // service object {serviceKey, serviceUrl, name, version}
    const editService = (value) => {
        if (value && value.serviceUrl) {
            const field = deploymentStage === 'production'
                ? 'production_url' : 'sandbox_url';
            dispatch({ field, value: value.serviceUrl });
        }
    };

    // Update swagger paths (for Mock Implementation)
    const updatePaths = (paths) => {
        if (swagger) {
            setSwagger({ ...swagger, paths });
        }
    };

    // Validation
    const nameExists = () => {
        if (!state.name) return false;
        const currentDef = isEditing
            ? (swagger?.[DEFS_KEY] || []).find(
                (d) => d.id === endpointId,
            ) : null;
        const current = currentDef?.name || '';
        return existingNames
            .filter((n) => n !== current)
            .some(
                (n) => n.toLowerCase()
                    === state.name.toLowerCase(),
            );
    };

    const noUrlTypes = [
        'default', 'INLINE', 'awslambda', 'sequence_backend',
    ];

    const hasErrors = () => {
        if (!state.name.trim()) return true;
        if (nameExists()) return true;
        // Types without URL fields don't need URL validation
        if (noUrlTypes.includes(state.endpoint_type)) {
            return false;
        }
        const prodUrl = state.production_endpoints?.url
            || (Array.isArray(state.production_endpoints)
                && state.production_endpoints[0]?.url);
        const sandUrl = state.sandbox_endpoints?.url
            || (Array.isArray(state.sandbox_endpoints)
                && state.sandbox_endpoints[0]?.url);
        if (!prodUrl && !sandUrl) return true;
        return false;
    };

    // Save
    const handleSave = () => {
        setValidating(true);
        if (hasErrors()) return;
        setSaving(true);

        const restApi = new API();
        restApi.getSwagger(api.id).then((response) => {
            const latestSwagger = response.body;
            const defs = latestSwagger[DEFS_KEY] || [];
            const result = { ...state };
            // Remove stale nested keys (fields already spread into state)
            delete result.endpointConfig;
            delete result.advancedConfig;

            // Strip sandbox_endpoints if URL is empty to avoid malformed
            // synapse XML at deployment (empty URL generates invalid
            // endpoint property elements)
            if (result.sandbox_endpoints) {
                const sbUrl = Array.isArray(result.sandbox_endpoints)
                    ? result.sandbox_endpoints[0]?.url
                    : result.sandbox_endpoints.url;
                if (!sbUrl) {
                    delete result.sandbox_endpoints;
                    delete result.sandbox_failovers;
                }
            }
            // Strip production_endpoints if URL is empty too
            if (result.production_endpoints) {
                const prodUrl = Array.isArray(result.production_endpoints)
                    ? result.production_endpoints[0]?.url
                    : result.production_endpoints.url;
                if (!prodUrl) {
                    delete result.production_endpoints;
                    delete result.production_failovers;
                }
            }

            let updatedDefs;
            if (isEditing) {
                result.id = endpointId;
                updatedDefs = defs.map(
                    (d) => (d.id === endpointId ? result : d),
                );
            } else {
                result.id = generateId();
                updatedDefs = [...defs, result];
            }

            const updatedSwagger = {
                ...latestSwagger,
                [DEFS_KEY]: updatedDefs,
            };

            // Set primary if first definition
            if (!isEditing && defs.length === 0) {
                updatedSwagger[PRIMARY_KEY] = result.id;
            }

            const apiInstance = new API();
            apiInstance.id = api.id;
            return apiInstance.updateSwagger(updatedSwagger);
        }).then(() => {
            Alert.info(
                isEditing
                    ? 'Endpoint definition updated successfully'
                    : 'Endpoint definition created successfully',
            );
            history.push(endpointsUrl);
        }).catch((error) => {
            console.error(error);
            Alert.error('Error saving endpoint definition');
        })
            .finally(() => {
                setSaving(false);
            });
    };

    // Advanced Config
    const openAdvanceConfig = (cat) => {
        setAdvConfigCategory(cat);
        setAdvConfigOpen(true);
    };

    const saveAdvanceConfig = (config) => {
        const endpointField = advConfigCategory === 'production'
            ? 'production_endpoints' : 'sandbox_endpoints';
        const currentEp = state[endpointField];
        if (Array.isArray(currentEp)) {
            const updated = [...currentEp];
            updated[0] = { ...updated[0], config };
            dispatch({ field: endpointField, value: updated });
        } else {
            dispatch({
                field: endpointField,
                value: { ...currentEp, config },
            });
        }
        setAdvConfigOpen(false);
    };

    // Security
    const openSecurityConfig = (cat) => {
        setSecurityCategory(cat);
        setSecurityOpen(true);
    };

    const saveSecurityConfig = (securityObj, enType) => {
        const category = enType || securityCategory;
        const { type } = securityObj;
        let newSecurityObj = securityObj;
        const secretPlaceholder = '******';
        newSecurityObj.clientSecret = newSecurityObj.clientSecret
            === secretPlaceholder ? '' : newSecurityObj.clientSecret;
        newSecurityObj.password = newSecurityObj.password
            === secretPlaceholder ? '' : newSecurityObj.password;
        if (type === 'NONE') {
            newSecurityObj = { ...CONSTS.DEFAULT_ENDPOINT_SECURITY, type };
        } else {
            newSecurityObj.enabled = true;
        }
        dispatch({
            field: 'endpoint_security',
            value: { [category]: newSecurityObj },
        });
        setSecurityOpen(false);
    };

    // Adapter dispatcher for Credentials component
    const credentialsDispatcher = (action) => {
        if (action.action === 'set_awsCredentials') {
            dispatch({ field: 'all', value: {
                ...state, ...action.value,
            } });
        }
    };

    // Adapter for Dynamic/Prototyped endpoint editing
    const editEndpoint = (idx, cat, url) => {
        const field = cat === 'production_endpoints'
            ? 'production_url' : 'sandbox_url';
        dispatch({ field, value: url });
    };

    // Redirect to policies page
    const saveAndRedirect = () => {
        history.push(
            urlPrefix + api.id + '/policies',
        );
    };

    const restricted = isRestricted(['apim:api_create'], api);

    return (
        <StyledGrid container justifyContent='center'>
            <Grid item sm={12} md={12} lg={8}>
                {/* Breadcrumb */}
                <Grid item md={12}>
                    <div className={classes.titleWrapper}>
                        <Link
                            to={endpointsUrl}
                            className={classes.titleLink}
                        >
                            <Typography variant='h4' component='h2'>
                                <FormattedMessage
                                    id={MSG_PREFIX + '.heading'}
                                    defaultMessage='Endpoints'
                                />
                            </Typography>
                        </Link>
                        <KeyboardArrowRightIcon />
                        <Typography variant='h4' component='h3'>
                            {isEditing ? (
                                <FormattedMessage
                                    id={MSG_PREFIX + '.editEndpoint'}
                                    defaultMessage='Edit Endpoint'
                                />
                            ) : (
                                <FormattedMessage
                                    id={MSG_PREFIX + '.addEndpoint'}
                                    defaultMessage='Add New Endpoint'
                                />
                            )}
                        </Typography>
                    </div>
                </Grid>

                {/* Form */}
                <Grid item md={12}>
                    <Paper elevation={0} className={classes.root}>
                        {/* Production/Sandbox Radio Toggle */}
                        {(state.endpoint_type === 'http'
                            || state.endpoint_type === 'address'
                            || state.endpoint_type === 'service'
                            || state.endpoint_type === 'default'
                        ) && (
                            <FormControl
                                component='fieldset'
                                sx={{ mb: 2 }}
                            >
                                <RadioGroup
                                    row
                                    value={deploymentStage}
                                    onChange={(e) => {
                                        setDeploymentStage(
                                            e.target.value,
                                        );
                                    }}
                                >
                                    <FormControlLabel
                                        value='production'
                                        control={<Radio />}
                                        label={(
                                            <FormattedMessage
                                                id={MSG_PREFIX
                                                    + '.production'}
                                                defaultMessage='Production'
                                            />
                                        )}
                                    />
                                    <FormControlLabel
                                        value='sandbox'
                                        control={<Radio />}
                                        label={(
                                            <FormattedMessage
                                                id={MSG_PREFIX
                                                    + '.sandbox'}
                                                defaultMessage='Sandbox'
                                            />
                                        )}
                                    />
                                </RadioGroup>
                            </FormControl>
                        )}

                        {/* Endpoint Type Dropdown */}
                        <FormControl
                            fullWidth
                            variant='outlined'
                            sx={{ mb: 2 }}
                        >
                            <InputLabel>
                                Endpoint Type
                            </InputLabel>
                            <Select
                                value={
                                    state.endpoint_type || 'http'
                                }
                                onChange={(e) => dispatch({
                                    field: 'endpoint_type',
                                    value: e.target.value,
                                })}
                                label='Endpoint Type'
                            >
                                <MenuItem value='http'>
                                    HTTP/REST Endpoint
                                </MenuItem>
                                <MenuItem value='service'>
                                    Service Endpoint
                                </MenuItem>
                                <MenuItem value='address'>
                                    HTTP/SOAP Endpoint
                                </MenuItem>
                                <MenuItem value='default'>
                                    Dynamic Endpoints
                                </MenuItem>
                                <MenuItem value='INLINE'>
                                    Mock Implementation
                                </MenuItem>
                                <MenuItem value='awslambda'>
                                    AWS Lambda
                                </MenuItem>
                                <MenuItem
                                    value='sequence_backend'
                                >
                                    Sequence Backend
                                </MenuItem>
                            </Select>
                        </FormControl>

                        {/* Endpoint Name */}
                        <TextField
                            label='Endpoint Name'
                            value={state.name}
                            onChange={(e) => dispatch({
                                field: 'name',
                                value: e.target.value,
                            })}
                            fullWidth
                            variant='outlined'
                            required
                            sx={{ mb: 2 }}
                            error={
                                (validating
                                    && !state.name.trim())
                                || nameExists()
                            }
                            helperText={
                                nameExists()
                                    ? 'A definition with this'
                                        + ' name already exists'
                                    : (validating
                                        && !state.name.trim()
                                        && 'Name is required')
                            }
                        />

                        {/* HTTP/REST & HTTP/SOAP URL */}
                        {(state.endpoint_type === 'http'
                            || state.endpoint_type === 'address'
                        ) && (
                            <GenericEndpoint
                                autoFocus
                                showIcons
                                name={
                                    deploymentStage === 'production'
                                        ? 'Production Endpoint'
                                        : 'Sandbox Endpoint'
                                }
                                endpointURL={
                                    deploymentStage === 'production'
                                        ? (state
                                            .production_endpoints
                                            ?.url || '')
                                        : (state
                                            .sandbox_endpoints
                                            ?.url || '')
                                }
                                type=''
                                index={0}
                                category={
                                    deploymentStage === 'production'
                                        ? 'production_endpoints'
                                        : 'sandbox_endpoints'
                                }
                                editEndpoint={editEndpoint}
                                deleteEndpoint={() => {}}
                                setAdvancedConfigOpen={
                                    () => openAdvanceConfig(
                                        deploymentStage,
                                    )
                                }
                                esCategory={deploymentStage}
                                setESConfigOpen={
                                    () => openSecurityConfig(
                                        deploymentStage,
                                    )
                                }
                                apiId={api.id}
                                componentValidator={[
                                    'advancedConfigurations',
                                ]}
                            />
                        )}

                        {/* Dynamic Endpoints */}
                        {state.endpoint_type === 'default' && (
                            <Paper sx={{ p: 2 }}>
                                <InlineMessage>
                                    <div>
                                        <Typography
                                            component='p'
                                        >
                                            <FormattedMessage
                                                id={MSG_PREFIX
                                                    + '.dynamic'
                                                    + '.msg'}
                                                defaultMessage={
                                                    'Please upload'
                                                    + ' a mediation'
                                                    + ' sequence'
                                                    + ' file to'
                                                    + ' Message'
                                                    + ' Mediation'
                                                    + ' Policies,'
                                                    + ' which sets'
                                                    + ' the'
                                                    + ' endpoints.'
                                                }
                                            />
                                            <IconButton
                                                onClick={
                                                    saveAndRedirect
                                                }
                                                size='large'
                                            >
                                                <LaunchIcon
                                                    fontSize='small'
                                                    color='primary'
                                                />
                                            </IconButton>
                                        </Typography>
                                    </div>
                                    {api.type !== 'WS' && (
                                        <>
                                            <Button
                                                aria-label='Settings'
                                                onClick={
                                                    () => openAdvanceConfig(
                                                        deploymentStage,
                                                    )
                                                }
                                                disabled={restricted}
                                                variant='outlined'
                                                sx={{ mr: 1 }}
                                            >
                                                <SettingsIcon
                                                    sx={{ mr: 0.5 }}
                                                />
                                                <Typography>
                                                    Advanced
                                                    Configurations
                                                </Typography>
                                            </Button>
                                            <Button
                                                aria-label='Security'
                                                onClick={
                                                    () => openSecurityConfig(
                                                        deploymentStage,
                                                    )
                                                }
                                                disabled={restricted}
                                                variant='outlined'
                                            >
                                                <SecurityIcon
                                                    sx={{ mr: 0.5 }}
                                                />
                                                <Typography>
                                                    Endpoint Security
                                                </Typography>
                                            </Button>
                                        </>
                                    )}
                                </InlineMessage>
                            </Paper>
                        )}

                        {/* Mock Implementation */}
                        {state.endpoint_type === 'INLINE'
                            && swagger && (
                            <MockImplEndpoints
                                paths={swagger.paths || {}}
                                swagger={swagger}
                                updatePaths={updatePaths}
                                endpointConfig={state}
                            />
                        )}

                        {/* AWS Lambda */}
                        {state.endpoint_type === 'awslambda' && (
                            <Credentials
                                apiId={api.id}
                                endpointConfig={state}
                                endpointsDispatcher={
                                    credentialsDispatcher
                                }
                            />
                        )}

                        {/* Service Endpoint */}
                        {state.endpoint_type === 'service' && (
                            <ServiceEndpoint
                                api={api}
                                services={servicesList}
                                category={
                                    deploymentStage === 'production'
                                        ? 'production_endpoints'
                                        : 'sandbox_endpoints'
                                }
                                type=''
                                setAdvancedConfigOpen={
                                    () => openAdvanceConfig(
                                        deploymentStage,
                                    )
                                }
                                esCategory={deploymentStage}
                                setESConfigOpen={
                                    () => openSecurityConfig(
                                        deploymentStage,
                                    )
                                }
                                name={
                                    deploymentStage === 'production'
                                        ? 'Production Endpoint'
                                        : 'Sandbox Endpoint'
                                }
                                editEndpoint={editEndpoint}
                                endpointURL={
                                    deploymentStage === 'production'
                                        ? (state
                                            .production_endpoints
                                            ?.url || '')
                                        : (state
                                            .sandbox_endpoints
                                            ?.url || '')
                                }
                                editService={editService}
                                index={0}
                            />
                        )}

                        {/* Sequence Backend */}
                        {state.endpoint_type
                            === 'sequence_backend' && (
                            <CustomBackend
                                api={api}
                                type='sequence_backend'
                                productionBackendList={
                                    prodBackendList
                                }
                                sandBoxBackendList={
                                    sandBackendList
                                }
                                setProductionBackendList={
                                    setProdBackendList
                                }
                                setSandBoxBackendList={
                                    setSandBackendList
                                }
                                isValidSequenceBackend={
                                    isValidSeqBackend
                                }
                                setIsValidSequenceBackend={
                                    setIsValidSeqBackend
                                }
                                setIsCustomBackendSelected={
                                    setIsCustomBackend
                                }
                            />
                        )}

                        {/* Certificates Section */}
                        {swagger && (
                            <Box sx={{ mt: 2 }}>
                                <GeneralConfiguration
                                    epConfig={{
                                        endpoint_type:
                                            state.endpoint_type,
                                        production_endpoints:
                                            state
                                                .production_endpoints,
                                        sandbox_endpoints:
                                            state
                                                .sandbox_endpoints,
                                    }}
                                    endpointType={
                                        state.endpoint_type
                                    }
                                />
                            </Box>
                        )}

                        {/* Action Buttons */}
                        <div className={classes.actionButtonSection}>
                            <Button
                                variant='contained'
                                color='primary'
                                onClick={handleSave}
                                disabled={restricted || saving}
                                sx={{ mr: 1 }}
                            >
                                {saving && (
                                    <CircularProgress size={20} />
                                )}
                                {!saving && isEditing && 'Update'}
                                {!saving && !isEditing && 'Create'}
                            </Button>
                            <Button
                                component={Link}
                                to={endpointsUrl}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Paper>
                </Grid>
            </Grid>

            {/* Advanced Config Dialog */}
            <Dialog open={advConfigOpen}>
                <DialogTitle>
                    <Typography sx={{ fontWeight: 600 }}>
                        <FormattedMessage
                            id={MSG_PREFIX
                                + '.advanceConfig'}
                            defaultMessage='Advanced Configurations'
                        />
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <AdvanceEndpointConfig
                        advanceConfig={
                            (advConfigCategory === 'production'
                                ? state.production_endpoints
                                : state.sandbox_endpoints
                            )?.config || {}
                        }
                        isSOAPEndpoint={
                            state.endpoint_type === 'address'
                        }
                        onSaveAdvanceConfig={saveAdvanceConfig}
                        onCancel={
                            () => setAdvConfigOpen(false)
                        }
                    />
                </DialogContent>
            </Dialog>

            {/* Security Dialog */}
            <Dialog open={securityOpen}>
                <DialogTitle>
                    <Typography sx={{ fontWeight: 600 }}>
                        <FormattedMessage
                            id={MSG_PREFIX
                                + '.securityConfig'}
                            defaultMessage={
                                'Endpoint Security'
                                + ' Configurations'
                            }
                        />
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {securityCategory === 'production' ? (
                        <EndpointSecurity
                            securityInfo={
                                state.endpoint_security
                                    ?.production
                                || {
                                    enabled: false,
                                    type: 'NONE',
                                }
                            }
                            saveEndpointSecurityConfig={
                                (secObj, enType) => {
                                    saveSecurityConfig(
                                        secObj, enType,
                                    );
                                }
                            }
                            closeEndpointSecurityConfig={
                                () => setSecurityOpen(false)
                            }
                            isProduction
                            endpointSecurityTypes={
                                endpointSecurityTypes
                            }
                        />
                    ) : (
                        <EndpointSecurity
                            securityInfo={
                                state.endpoint_security
                                    ?.sandbox
                                || {
                                    enabled: false,
                                    type: 'NONE',
                                }
                            }
                            saveEndpointSecurityConfig={
                                (secObj, enType) => {
                                    saveSecurityConfig(
                                        secObj, enType,
                                    );
                                }
                            }
                            closeEndpointSecurityConfig={
                                () => setSecurityOpen(false)
                            }
                            endpointSecurityTypes={
                                endpointSecurityTypes
                            }
                        />
                    )}
                </DialogContent>
            </Dialog>
        </StyledGrid>
    );
}

AddEditResourceEndpoint.propTypes = {
    match: PropTypes.shape({
        params: PropTypes.shape({
            id: PropTypes.string,
        }),
    }).isRequired,
};
