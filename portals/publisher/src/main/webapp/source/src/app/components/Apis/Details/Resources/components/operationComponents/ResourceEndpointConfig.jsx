/**
 * Copyright (c) 2026, WSO2 LLC. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
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

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon
    from '@mui/icons-material/InsertDriveFile';
import InputAdornment from '@mui/material/InputAdornment';
import Icon from '@mui/material/Icon';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { FormattedMessage } from 'react-intl';
import Dropzone from 'react-dropzone';
import ResourceEndpointSecurity
    from './ResourceEndpointSecurity';
import ResourceAdvancedConfig
    from './ResourceAdvancedConfig';

const EXTENSION_KEY = 'x-wso2-resource-endpoint-config';

const MSG_PREFIX = 'Apis.Details.Resources.components'
    + '.operationComponents.ResourceEndpointConfig';

const ROUND_ROBIN_ALGO = 'org.apache.synapse.endpoints'
    + '.algorithms.RoundRobin';

const DEFAULT_ADVANCED_CONFIG = {
    actionSelect: 'fault',
    actionDuration: 30000,
    retryTimeOut: 0,
    retryDelay: 0,
    factor: 1,
    suspendDuration: 30000,
    suspendMaxDuration: 60000,
    suspendErrorCode: [],
    retryErroCode: [],
};

const DEFAULT_CONFIG = {
    endpoint_type: 'http',
    production_endpoints: { url: '' },
    sandbox_endpoints: { url: '' },
    production_failovers: [],
    sandbox_failovers: [],
    algoCombo: ROUND_ROBIN_ALGO,
    sessionManagement: '',
    sessionTimeOut: 0,
    endpoint_security: {
        production: { type: 'NONE' },
        sandbox: { type: 'NONE' },
    },
    advancedConfig: { ...DEFAULT_ADVANCED_CONFIG },
    certificates: [],
};

/**
 * Extracts a single URL from an endpoints value that
 * may be either a single object or an array.
 *
 * @param {object|Array} endpoints The endpoints value
 * @returns {string} The first URL found
 */
function extractUrl(endpoints) {
    if (Array.isArray(endpoints)) {
        return (endpoints[0] && endpoints[0].url) || '';
    }
    return (endpoints && endpoints.url) || '';
}

/**
 * Resource-level endpoint configuration per operation.
 * Supports HTTP, Load Balance, and Failover endpoint
 * types with endpoint security and advanced configuration.
 *
 * Rendered inside each operation accordion on the
 * Resources page.
 *
 * @param {object} props Component props
 * @returns {JSX.Element} The resource endpoint config
 */
export default function ResourceEndpointConfig(props) {
    const {
        operation,
        operationsDispatcher,
        target,
        verb,
        disableUpdate,
    } = props;

    const config = operation[EXTENSION_KEY] || null;
    const isEnabled = !!config;
    const [securityDialogOpen, setSecurityDialogOpen]
        = useState(false);
    const [advancedDialogOpen, setAdvancedDialogOpen]
        = useState(false);
    const [certsDialogOpen, setCertsDialogOpen]
        = useState(false);
    const [newCertAlias, setNewCertAlias]
        = useState('');
    const [newCertType, setNewCertType]
        = useState('production');
    const [newCertFile, setNewCertFile]
        = useState(null);
    const [isCertRejected, setIsCertRejected]
        = useState(false);
    const [securityCategory, setSecurityCategory]
        = useState('production');

    // ---- Core dispatch ----

    const updateConfig = (newConfig) => {
        operationsDispatcher({
            action: 'resourceEndpointConfig',
            data: { target, verb, value: newConfig },
        });
    };

    const handleToggle = () => {
        if (!isEnabled) {
            updateConfig({ ...DEFAULT_CONFIG });
        } else {
            updateConfig(null);
        }
    };

    // ---- Endpoint Type ----

    const handleEndpointTypeChange = (event) => {
        const newType = event.target.value;
        const prodUrl = extractUrl(config.production_endpoints);
        const sandUrl = extractUrl(config.sandbox_endpoints);
        const updated = { ...config, endpoint_type: newType };

        if (newType === 'load_balance') {
            updated.production_endpoints = [{ url: prodUrl }];
            updated.sandbox_endpoints = [{ url: sandUrl }];
        } else {
            updated.production_endpoints = { url: prodUrl };
            updated.sandbox_endpoints = { url: sandUrl };
        }
        if (newType === 'failover') {
            updated.production_failovers = [];
            updated.sandbox_failovers = [];
        }
        updateConfig(updated);
    };

    // ---- HTTP single-URL handlers ----

    const handleProdUrlChange = (event) => {
        updateConfig({
            ...config,
            production_endpoints: { url: event.target.value },
        });
    };

    const handleSandUrlChange = (event) => {
        updateConfig({
            ...config,
            sandbox_endpoints: { url: event.target.value },
        });
    };

    // ---- Load Balance multi-URL handlers ----

    const handleLBUrlChange = (category, event, index) => {
        const endpoints = [...config[category]];
        endpoints[index] = { url: event.target.value };
        updateConfig({ ...config, [category]: endpoints });
    };

    const addLBEndpoint = (category) => {
        updateConfig({
            ...config,
            [category]: [...config[category], { url: '' }],
        });
    };

    const removeLBEndpoint = (category, index) => {
        const endpoints = [...config[category]];
        endpoints.splice(index, 1);
        updateConfig({ ...config, [category]: endpoints });
    };

    // ---- Failover handlers ----

    const handleFOPrimaryChange = (category, event) => {
        updateConfig({
            ...config,
            [category]: { url: event.target.value },
        });
    };

    const handleFOFailoverChange = (category, event, idx) => {
        const failovers = [...(config[category] || [])];
        failovers[idx] = { url: event.target.value };
        updateConfig({ ...config, [category]: failovers });
    };

    const addFailover = (category) => {
        updateConfig({
            ...config,
            [category]: [
                ...(config[category] || []),
                { url: '' },
            ],
        });
    };

    const removeFailover = (category, index) => {
        const failovers = [...(config[category] || [])];
        failovers.splice(index, 1);
        updateConfig({ ...config, [category]: failovers });
    };

    // ---- Sub-component update handlers ----

    const handleSecurityUpdate = (newSecurity) => {
        updateConfig({
            ...config,
            endpoint_security: newSecurity,
        });
    };

    const handleAdvancedUpdate = (newAdvanced) => {
        updateConfig({
            ...config,
            advancedConfig: newAdvanced,
        });
    };

    // ---- Certificate handlers ----

    const handleAddCertificate = () => {
        if (!newCertAlias || !newCertFile) return;
        const existing = config.certificates || [];
        const duplicate = existing.some(
            (c) => c.alias === newCertAlias,
        );
        if (duplicate) return;
        updateConfig({
            ...config,
            certificates: [
                ...existing,
                {
                    alias: newCertAlias,
                    type: newCertType,
                    fileName: newCertFile.name,
                },
            ],
        });
        setNewCertAlias('');
        setNewCertType('production');
        setNewCertFile(null);
        setIsCertRejected(false);
    };

    const handleRemoveCertificate = (index) => {
        const certs = [...(config.certificates || [])];
        certs.splice(index, 1);
        updateConfig({
            ...config,
            certificates: certs,
        });
    };

    // ---- Render: Endpoint adornment icons ----

    const renderEndpointAdornment = (category) => (
        <InputAdornment position='end'>
            <IconButton
                size='small'
                disabled
                sx={{ p: 0.5 }}
            >
                <Icon fontSize='small'>
                    check_circle
                </Icon>
            </IconButton>
            <IconButton
                size='small'
                onClick={
                    () => setAdvancedDialogOpen(true)
                }
                disabled={disableUpdate}
                sx={{ p: 0.5 }}
            >
                <Tooltip
                    placement='top-start'
                    title={(
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.configTooltip'
                            }
                            defaultMessage='Endpoint configurations'
                        />
                    )}
                >
                    <Icon fontSize='small'>
                        settings
                    </Icon>
                </Tooltip>
            </IconButton>
            <IconButton
                size='small'
                onClick={() => {
                    setSecurityCategory(category);
                    setSecurityDialogOpen(true);
                }}
                disabled={disableUpdate}
                sx={{ p: 0.5 }}
            >
                <Tooltip
                    placement='top-start'
                    title={(
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.securityTooltip'
                            }
                            defaultMessage='Endpoint security'
                        />
                    )}
                >
                    <Icon fontSize='small'>
                        security
                    </Icon>
                </Tooltip>
            </IconButton>
            <IconButton
                size='small'
                onClick={
                    () => setCertsDialogOpen(true)
                }
                disabled={disableUpdate}
                sx={{ p: 0.5 }}
            >
                <Tooltip
                    placement='top-start'
                    title={(
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.certsTooltip'
                            }
                            defaultMessage='Certificates'
                        />
                    )}
                >
                    <Icon fontSize='small'>
                        lock
                    </Icon>
                </Tooltip>
            </IconButton>
        </InputAdornment>
    );

    // ---- Validation helpers ----

    const hasAnyUrl = () => {
        if (!config) return false;
        const ep = config.production_endpoints;
        const se = config.sandbox_endpoints;
        if (config.endpoint_type === 'load_balance') {
            const prodHas = Array.isArray(ep)
                && ep.some((e) => e.url);
            const sandHas = Array.isArray(se)
                && se.some((e) => e.url);
            return prodHas || sandHas;
        }
        const prodHas = ep && ep.url;
        const sandHas = se && se.url;
        return !!(prodHas || sandHas);
    };

    const urlMissing = isEnabled && !hasAnyUrl();

    // ---- Render: URL list with add/remove ----

    const renderUrlList = (
        category, endpoints, label,
        placeholderPrefix,
    ) => (
        <>
            <Grid item md={1} xs={1} />
            <Grid item md={10} xs={10}>
                <Typography variant='body2' sx={{ mb: 1 }}>
                    {label}
                </Typography>
                {(endpoints || []).map((ep, idx) => (
                    <Box
                        // eslint-disable-next-line react/no-array-index-key
                        key={`${category}-${idx}`}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 1,
                        }}
                    >
                        <TextField
                            value={ep.url || ''}
                            onChange={(e) => handleLBUrlChange(
                                category, e, idx,
                            )}
                            fullWidth
                            variant='outlined'
                            size='small'
                            disabled={disableUpdate}
                            placeholder={
                                `${placeholderPrefix}-`
                                + `${idx + 1}.example.com`
                            }
                            error={
                                idx === 0 && urlMissing
                            }
                            helperText={
                                idx === 0
                                && urlMissing
                                && (
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.urlError'
                                        }
                                        defaultMessage={
                                            'Provide at'
                                            + ' least one'
                                            + ' endpoint URL'
                                        }
                                    />
                                )
                            }
                        />
                        {endpoints.length > 1 && (
                            <IconButton
                                size='small'
                                onClick={() => removeLBEndpoint(
                                    category, idx,
                                )}
                                disabled={disableUpdate}
                                sx={{ ml: 0.5 }}
                            >
                                <DeleteIcon fontSize='small' />
                            </IconButton>
                        )}
                    </Box>
                ))}
                <Button
                    size='small'
                    onClick={() => addLBEndpoint(category)}
                    disabled={disableUpdate}
                >
                    <FormattedMessage
                        id={MSG_PREFIX + '.addEndpoint'}
                        defaultMessage='+ Add Endpoint'
                    />
                </Button>
            </Grid>
            <Grid item md={1} xs={1} />
        </>
    );

    // ---- Render: Failover section ----

    const renderFailoverSection = (
        primaryCategory, failoverCategory,
        primaryLabel, failoverLabel,
        primaryPlaceholder,
    ) => (
        <>
            <Grid item md={1} xs={1} />
            <Grid item md={10} xs={10}>
                <Typography variant='body2' sx={{ mb: 1 }}>
                    {primaryLabel}
                </Typography>
                <TextField
                    value={
                        config[primaryCategory]
                            ? config[primaryCategory].url || ''
                            : ''
                    }
                    onChange={(e) => handleFOPrimaryChange(
                        primaryCategory, e,
                    )}
                    fullWidth
                    variant='outlined'
                    size='small'
                    disabled={disableUpdate}
                    placeholder={primaryPlaceholder}
                    sx={{ mb: 1 }}
                    error={urlMissing}
                    helperText={
                        urlMissing
                        && (
                            <FormattedMessage
                                id={
                                    MSG_PREFIX
                                    + '.urlError'
                                }
                                defaultMessage={
                                    'Provide at'
                                    + ' least one'
                                    + ' endpoint URL'
                                }
                            />
                        )
                    }
                />
                <Typography variant='body2' sx={{ mb: 1 }}>
                    {failoverLabel}
                </Typography>
                {(config[failoverCategory] || []).map(
                    (ep, idx) => (
                        <Box
                            // eslint-disable-next-line react/no-array-index-key
                            key={`fo-${failoverCategory}-${idx}`}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 1,
                            }}
                        >
                            <TextField
                                value={ep.url || ''}
                                onChange={(e) => (
                                    handleFOFailoverChange(
                                        failoverCategory, e, idx,
                                    )
                                )}
                                fullWidth
                                variant='outlined'
                                size='small'
                                disabled={disableUpdate}
                                placeholder={
                                    `https://failover-`
                                    + `${idx + 1}.example.com`
                                }
                            />
                            <IconButton
                                size='small'
                                onClick={() => removeFailover(
                                    failoverCategory, idx,
                                )}
                                disabled={disableUpdate}
                                sx={{ ml: 0.5 }}
                            >
                                <DeleteIcon fontSize='small' />
                            </IconButton>
                        </Box>
                    ),
                )}
                <Button
                    size='small'
                    onClick={() => addFailover(
                        failoverCategory,
                    )}
                    disabled={disableUpdate}
                >
                    <FormattedMessage
                        id={MSG_PREFIX + '.addFailover'}
                        defaultMessage='+ Add Failover Endpoint'
                    />
                </Button>
            </Grid>
            <Grid item md={1} xs={1} />
        </>
    );

    // ---- Main Render ----

    return (
        <>
            {/* Section Title */}
            <Grid item md={12} xs={12}>
                <Typography variant='subtitle1'>
                    <FormattedMessage
                        id={MSG_PREFIX + '.title'}
                        defaultMessage='Resource Endpoint Configuration'
                    />
                    <Divider variant='middle' />
                </Typography>
            </Grid>

            {/* Description */}
            <Grid item md={1} xs={1} />
            <Grid item md={10} xs={10}>
                <Typography
                    variant='body2'
                    color='textSecondary'
                    sx={{ mb: 1 }}
                >
                    <FormattedMessage
                        id={MSG_PREFIX + '.description'}
                        defaultMessage={
                            'By default, this resource uses '
                            + 'the API-level endpoint. Enable '
                            + 'to route this resource to a '
                            + 'different backend.'
                        }
                    />
                </Typography>
            </Grid>
            <Grid item md={1} xs={1} />

            {/* Toggle Switch */}
            <Grid item md={1} xs={1} />
            <Grid item md={10} xs={10}>
                <FormControlLabel
                    control={(
                        <Switch
                            checked={isEnabled}
                            onChange={handleToggle}
                            disabled={disableUpdate}
                            color='primary'
                            size='small'
                        />
                    )}
                    label={(
                        <FormattedMessage
                            id={MSG_PREFIX + '.toggleLabel'}
                            defaultMessage={
                                'Use custom endpoint '
                                + 'for this resource'
                            }
                        />
                    )}
                />
            </Grid>
            <Grid item md={1} xs={1} />

            {isEnabled && (
                <>
                    {/* Endpoint Type Selector */}
                    <Grid item md={1} xs={1} />
                    <Grid item md={10} xs={10}>
                        <FormControl
                            fullWidth
                            size='small'
                            variant='outlined'
                            sx={{ mt: 1, mb: 1 }}
                        >
                            <InputLabel>
                                <FormattedMessage
                                    id={
                                        MSG_PREFIX
                                        + '.endpointType'
                                    }
                                    defaultMessage='Endpoint Type'
                                />
                            </InputLabel>
                            <Select
                                value={
                                    config.endpoint_type
                                    || 'http'
                                }
                                onChange={
                                    handleEndpointTypeChange
                                }
                                label='Endpoint Type'
                                disabled={disableUpdate}
                            >
                                <MenuItem value='http'>
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.typeHttp'
                                        }
                                        defaultMessage='HTTP Endpoint'
                                    />
                                </MenuItem>
                                <MenuItem value='load_balance'>
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.typeLB'
                                        }
                                        defaultMessage='Load Balanced'
                                    />
                                </MenuItem>
                                <MenuItem value='failover'>
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.typeFailover'
                                        }
                                        defaultMessage='Failover'
                                    />
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item md={1} xs={1} />

                    {/* HTTP Endpoints */}
                    {config.endpoint_type === 'http' && (
                        <>
                            <Grid item md={1} xs={1} />
                            <Grid item md={5} xs={5}>
                                <TextField
                                    label={(
                                        <FormattedMessage
                                            id={
                                                MSG_PREFIX
                                                + '.prodUrl'
                                            }
                                            defaultMessage={
                                                'Production'
                                                + ' Endpoint URL'
                                            }
                                        />
                                    )}
                                    value={
                                        config
                                            .production_endpoints
                                            ?.url || ''
                                    }
                                    onChange={
                                        handleProdUrlChange
                                    }
                                    fullWidth
                                    variant='outlined'
                                    size='small'
                                    disabled={disableUpdate}
                                    error={urlMissing}
                                    helperText={
                                        urlMissing
                                        && (
                                            <FormattedMessage
                                                id={
                                                    MSG_PREFIX
                                                    + '.urlError'
                                                }
                                                defaultMessage={
                                                    'Provide at'
                                                    + ' least one'
                                                    + ' endpoint URL'
                                                }
                                            />
                                        )
                                    }
                                    placeholder={
                                        'https://production'
                                        + '.example.com'
                                    }
                                    InputProps={{
                                        endAdornment:
                                            renderEndpointAdornment('production'),
                                    }}
                                />
                            </Grid>
                            <Grid item md={5} xs={5}>
                                <TextField
                                    label={(
                                        <FormattedMessage
                                            id={
                                                MSG_PREFIX
                                                + '.sandUrl'
                                            }
                                            defaultMessage={
                                                'Sandbox'
                                                + ' Endpoint URL'
                                            }
                                        />
                                    )}
                                    value={
                                        config
                                            .sandbox_endpoints
                                            ?.url || ''
                                    }
                                    onChange={
                                        handleSandUrlChange
                                    }
                                    fullWidth
                                    variant='outlined'
                                    size='small'
                                    disabled={disableUpdate}
                                    error={urlMissing}
                                    helperText={
                                        urlMissing
                                        && (
                                            <FormattedMessage
                                                id={
                                                    MSG_PREFIX
                                                    + '.urlError'
                                                }
                                                defaultMessage={
                                                    'Provide at'
                                                    + ' least one'
                                                    + ' endpoint URL'
                                                }
                                            />
                                        )
                                    }
                                    placeholder={
                                        'https://sandbox'
                                        + '.example.com'
                                    }
                                    InputProps={{
                                        endAdornment:
                                            renderEndpointAdornment('sandbox'),
                                    }}
                                />
                            </Grid>
                            <Grid item md={1} xs={1} />
                        </>
                    )}

                    {/* Load Balance Endpoints */}
                    {config.endpoint_type === 'load_balance'
                        && (
                            <>
                                {renderUrlList(
                                    'production_endpoints',
                                    config.production_endpoints,
                                    (
                                        <FormattedMessage
                                            id={
                                                MSG_PREFIX
                                                + '.prodEndpoints'
                                            }
                                            defaultMessage='Production Endpoints'
                                        />
                                    ),
                                    'https://production',
                                )}
                                {renderUrlList(
                                    'sandbox_endpoints',
                                    config.sandbox_endpoints,
                                    (
                                        <FormattedMessage
                                            id={
                                                MSG_PREFIX
                                                + '.sandEndpoints'
                                            }
                                            defaultMessage='Sandbox Endpoints'
                                        />
                                    ),
                                    'https://sandbox',
                                )}
                                {/* LB Algorithm + Session */}
                                <Grid item md={1} xs={1} />
                                <Grid item md={5} xs={5}>
                                    <FormControl
                                        fullWidth
                                        size='small'
                                        variant='outlined'
                                    >
                                        <InputLabel>
                                            <FormattedMessage
                                                id={
                                                    MSG_PREFIX
                                                    + '.algo'
                                                }
                                                defaultMessage='Algorithm'
                                            />
                                        </InputLabel>
                                        <Select
                                            value={
                                                config.algoCombo
                                                || ROUND_ROBIN_ALGO
                                            }
                                            onChange={(e) => (
                                                updateConfig({
                                                    ...config,
                                                    algoCombo:
                                                        e.target
                                                            .value,
                                                })
                                            )}
                                            label='Algorithm'
                                            disabled={
                                                disableUpdate
                                            }
                                        >
                                            <MenuItem
                                                value={
                                                    ROUND_ROBIN_ALGO
                                                }
                                            >
                                                Round-Robin
                                            </MenuItem>
                                            <MenuItem
                                                value='other'
                                            >
                                                Other
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item md={5} xs={5}>
                                    <FormControl
                                        fullWidth
                                        size='small'
                                        variant='outlined'
                                    >
                                        <InputLabel>
                                            <FormattedMessage
                                                id={
                                                    MSG_PREFIX
                                                    + '.session'
                                                }
                                                defaultMessage={
                                                    'Session '
                                                    + 'Management'
                                                }
                                            />
                                        </InputLabel>
                                        <Select
                                            value={
                                                config
                                                    .sessionManagement
                                                || ''
                                            }
                                            onChange={(e) => (
                                                updateConfig({
                                                    ...config,
                                                    sessionManagement:
                                                        e.target
                                                            .value,
                                                })
                                            )}
                                            label={
                                                'Session'
                                                + ' Management'
                                            }
                                            disabled={
                                                disableUpdate
                                            }
                                        >
                                            <MenuItem value=''>
                                                None
                                            </MenuItem>
                                            <MenuItem
                                                value='http'
                                            >
                                                Transport
                                            </MenuItem>
                                            <MenuItem
                                                value='soap'
                                            >
                                                SOAP
                                            </MenuItem>
                                            <MenuItem
                                                value={
                                                    'simpleClient'
                                                    + 'Session'
                                                }
                                            >
                                                Client ID
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item md={1} xs={1} />

                                {/* Session Timeout */}
                                {config.sessionManagement
                                    && (
                                        <>
                                            <Grid
                                                item
                                                md={1}
                                                xs={1}
                                            />
                                            <Grid
                                                item
                                                md={5}
                                                xs={5}
                                            >
                                                <TextField
                                                    label={(
                                                        <FormattedMessage
                                                            id={
                                                                MSG_PREFIX
                                                                + '.sessionTimeout'
                                                            }
                                                            defaultMessage={
                                                                'Session'
                                                                + ' Timeout'
                                                                + ' (ms)'
                                                            }
                                                        />
                                                    )}
                                                    value={
                                                        config
                                                            .sessionTimeOut
                                                        || 0
                                                    }
                                                    onChange={
                                                        (e) => updateConfig({
                                                            ...config,
                                                            sessionTimeOut:
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                    10,
                                                                ) || 0,
                                                        })
                                                    }
                                                    fullWidth
                                                    variant='outlined'
                                                    size='small'
                                                    type='number'
                                                    disabled={
                                                        disableUpdate
                                                    }
                                                    sx={{
                                                        mt: 1,
                                                    }}
                                                />
                                            </Grid>
                                            <Grid
                                                item
                                                md={6}
                                                xs={6}
                                            />
                                        </>
                                    )}
                            </>
                        )}

                    {/* Failover Endpoints */}
                    {config.endpoint_type === 'failover'
                        && (
                            <>
                                {renderFailoverSection(
                                    'production_endpoints',
                                    'production_failovers',
                                    (
                                        <FormattedMessage
                                            id={
                                                MSG_PREFIX
                                                + '.prodPrimary'
                                            }
                                            defaultMessage='Production Primary Endpoint'
                                        />
                                    ),
                                    (
                                        <FormattedMessage
                                            id={
                                                MSG_PREFIX
                                                + '.prodFailovers'
                                            }
                                            defaultMessage='Production Failover Endpoints'
                                        />
                                    ),
                                    'https://production-primary.example.com',
                                )}
                                {renderFailoverSection(
                                    'sandbox_endpoints',
                                    'sandbox_failovers',
                                    (
                                        <FormattedMessage
                                            id={
                                                MSG_PREFIX
                                                + '.sandPrimary'
                                            }
                                            defaultMessage='Sandbox Primary Endpoint'
                                        />
                                    ),
                                    (
                                        <FormattedMessage
                                            id={
                                                MSG_PREFIX
                                                + '.sandFailovers'
                                            }
                                            defaultMessage='Sandbox Failover Endpoints'
                                        />
                                    ),
                                    'https://sandbox-primary.example.com',
                                )}
                            </>
                        )}

                    {/* Action icons for LB/Failover */}
                    {config.endpoint_type !== 'http'
                        && (
                            <>
                                <Grid
                                    item
                                    md={1}
                                    xs={1}
                                />
                                <Grid
                                    item
                                    md={10}
                                    xs={10}
                                >
                                    <Box
                                        sx={{
                                            display:
                                                'flex',
                                            gap: 0.5,
                                            mt: 1,
                                        }}
                                    >
                                        <IconButton
                                            size='small'
                                            disabled
                                            sx={{
                                                p: 0.5,
                                            }}
                                        >
                                            <Icon
                                                fontSize='small'
                                            >
                                                check_circle
                                            </Icon>
                                        </IconButton>
                                        <IconButton
                                            size='small'
                                            onClick={
                                                () => setAdvancedDialogOpen(
                                                    true,
                                                )
                                            }
                                            disabled={
                                                disableUpdate
                                            }
                                            sx={{
                                                p: 0.5,
                                            }}
                                        >
                                            <Tooltip
                                                placement='top-start'
                                                title={(
                                                    <FormattedMessage
                                                        id={
                                                            MSG_PREFIX
                                                            + '.configTooltip'
                                                        }
                                                        defaultMessage='Endpoint configurations'
                                                    />
                                                )}
                                            >
                                                <Icon
                                                    fontSize='small'
                                                >
                                                    settings
                                                </Icon>
                                            </Tooltip>
                                        </IconButton>
                                        <IconButton
                                            size='small'
                                            onClick={() => {
                                                setSecurityCategory(
                                                    'production',
                                                );
                                                setSecurityDialogOpen(
                                                    true,
                                                );
                                            }}
                                            disabled={
                                                disableUpdate
                                            }
                                            sx={{
                                                p: 0.5,
                                            }}
                                        >
                                            <Tooltip
                                                placement='top-start'
                                                title={(
                                                    <FormattedMessage
                                                        id={
                                                            MSG_PREFIX
                                                            + '.securityTooltip'
                                                        }
                                                        defaultMessage='Endpoint security'
                                                    />
                                                )}
                                            >
                                                <Icon
                                                    fontSize='small'
                                                >
                                                    security
                                                </Icon>
                                            </Tooltip>
                                        </IconButton>
                                        <IconButton
                                            size='small'
                                            onClick={
                                                () => setCertsDialogOpen(
                                                    true,
                                                )
                                            }
                                            disabled={
                                                disableUpdate
                                            }
                                            sx={{
                                                p: 0.5,
                                            }}
                                        >
                                            <Tooltip
                                                placement='top-start'
                                                title={(
                                                    <FormattedMessage
                                                        id={
                                                            MSG_PREFIX
                                                            + '.certsTooltip'
                                                        }
                                                        defaultMessage='Certificates'
                                                    />
                                                )}
                                            >
                                                <Icon
                                                    fontSize='small'
                                                >
                                                    lock
                                                </Icon>
                                            </Tooltip>
                                        </IconButton>
                                    </Box>
                                </Grid>
                                <Grid
                                    item
                                    md={1}
                                    xs={1}
                                />
                            </>
                        )}

                    {/* Endpoint Security Dialog */}
                    <Dialog
                        open={securityDialogOpen}
                        onClose={
                            () => setSecurityDialogOpen(
                                false,
                            )
                        }
                        maxWidth='md'
                        fullWidth
                    >
                        <DialogTitle>
                            <FormattedMessage
                                id={
                                    MSG_PREFIX
                                    + '.securityTitle'
                                }
                                defaultMessage={
                                    '{category}'
                                    + ' Endpoint Security'
                                }
                                values={{
                                    category:
                                        securityCategory
                                        === 'production'
                                            ? 'Production'
                                            : 'Sandbox',
                                }}
                            />
                        </DialogTitle>
                        <DialogContent dividers>
                            <ResourceEndpointSecurity
                                security={
                                    config
                                        ?.endpoint_security
                                    || {
                                        production: {
                                            type: 'NONE',
                                        },
                                        sandbox: {
                                            type: 'NONE',
                                        },
                                    }
                                }
                                onUpdate={
                                    handleSecurityUpdate
                                }
                                disabled={disableUpdate}
                                category={
                                    securityCategory
                                }
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={
                                    () => setSecurityDialogOpen(
                                        false,
                                    )
                                }
                            >
                                <FormattedMessage
                                    id={
                                        MSG_PREFIX
                                        + '.securityClose'
                                    }
                                    defaultMessage='Close'
                                />
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Advanced Config Dialog */}
                    <Dialog
                        open={advancedDialogOpen}
                        onClose={
                            () => setAdvancedDialogOpen(
                                false,
                            )
                        }
                        maxWidth='md'
                        fullWidth
                    >
                        <DialogTitle>
                            <FormattedMessage
                                id={
                                    MSG_PREFIX
                                    + '.advancedTitle'
                                }
                                defaultMessage={
                                    'Advanced '
                                    + 'Configuration'
                                }
                            />
                        </DialogTitle>
                        <DialogContent dividers>
                            <ResourceAdvancedConfig
                                config={
                                    config?.advancedConfig
                                    || {
                                        ...DEFAULT_ADVANCED_CONFIG,
                                    }
                                }
                                onUpdate={
                                    handleAdvancedUpdate
                                }
                                disabled={disableUpdate}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button
                                onClick={
                                    () => setAdvancedDialogOpen(
                                        false,
                                    )
                                }
                            >
                                <FormattedMessage
                                    id={
                                        MSG_PREFIX
                                        + '.advancedClose'
                                    }
                                    defaultMessage='Close'
                                />
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Certificates Dialog */}
                    <Dialog
                        open={certsDialogOpen}
                        onClose={
                            () => setCertsDialogOpen(
                                false,
                            )
                        }
                        maxWidth='sm'
                        fullWidth
                    >
                        <DialogTitle>
                            <FormattedMessage
                                id={
                                    MSG_PREFIX
                                    + '.certsTitle'
                                }
                                defaultMessage='Certificates'
                            />
                        </DialogTitle>
                        <DialogContent dividers>
                            {/* Certificate list */}
                            {(config?.certificates || [])
                                .length === 0 && (
                                <Typography
                                    variant='body2'
                                    color='textSecondary'
                                    sx={{
                                        textAlign: 'center',
                                        py: 2,
                                    }}
                                >
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.noCerts'
                                        }
                                        defaultMessage={
                                            'No certificates'
                                            + ' added yet.'
                                        }
                                    />
                                </Typography>
                            )}
                            {(config?.certificates || [])
                                .map((cert, idx) => (
                                    <Box
                                        key={
                                            `cert-${cert.alias}`
                                        }
                                        sx={{
                                            display: 'flex',
                                            alignItems:
                                                'center',
                                            justifyContent:
                                                'space-between',
                                            p: 1,
                                            mb: 0.5,
                                            border:
                                                '1px solid',
                                            borderColor:
                                                'divider',
                                            borderRadius: 1,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display:
                                                    'flex',
                                                alignItems:
                                                    'center',
                                                gap: 1,
                                            }}
                                        >
                                            <Icon
                                                fontSize='small'
                                                color='action'
                                            >
                                                lock
                                            </Icon>
                                            <Box>
                                                <Typography
                                                    variant='body2'
                                                    sx={{
                                                        fontWeight:
                                                            500,
                                                    }}
                                                >
                                                    {cert.alias}
                                                </Typography>
                                                <Typography
                                                    variant='caption'
                                                    color='textSecondary'
                                                >
                                                    {cert.type
                                                        === 'production'
                                                        ? 'Production'
                                                        : 'Sandbox'}
                                                    {cert.fileName
                                                        && ` \u2022 ${cert.fileName}`}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <IconButton
                                            size='small'
                                            onClick={
                                                () => handleRemoveCertificate(
                                                    idx,
                                                )
                                            }
                                            disabled={
                                                disableUpdate
                                            }
                                        >
                                            <DeleteIcon
                                                fontSize='small'
                                            />
                                        </IconButton>
                                    </Box>
                                ))}

                            {/* Add certificate form */}
                            <Divider
                                sx={{ my: 2 }}
                            />
                            <Typography
                                variant='body1'
                                sx={{ mb: 1 }}
                            >
                                <FormattedMessage
                                    id={
                                        MSG_PREFIX
                                        + '.addCert'
                                    }
                                    defaultMessage='Add Certificate'
                                />
                            </Typography>
                            <TextField
                                label={(
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.certAlias'
                                        }
                                        defaultMessage='Alias'
                                    />
                                )}
                                value={newCertAlias}
                                onChange={
                                    (e) => setNewCertAlias(
                                        e.target.value,
                                    )
                                }
                                fullWidth
                                size='small'
                                variant='outlined'
                                sx={{ mb: 2 }}
                                inputProps={{
                                    maxLength: 45,
                                }}
                                error={
                                    !!newCertAlias
                                    && (
                                        config
                                            ?.certificates
                                        || []
                                    ).some(
                                        (c) => c.alias
                                            === newCertAlias,
                                    )
                                }
                                helperText={
                                    newCertAlias
                                    && (
                                        config
                                            ?.certificates
                                        || []
                                    ).some(
                                        (c) => c.alias
                                            === newCertAlias,
                                    )
                                        ? (
                                            <FormattedMessage
                                                id={
                                                    MSG_PREFIX
                                                    + '.aliasExists'
                                                }
                                                defaultMessage='Alias already exists'
                                            />
                                        )
                                        : ''
                                }
                            />
                            <FormControl
                                fullWidth
                                size='small'
                                variant='outlined'
                                sx={{ mb: 2 }}
                            >
                                <InputLabel>
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.certEndpoint'
                                        }
                                        defaultMessage='Endpoint'
                                    />
                                </InputLabel>
                                <Select
                                    value={newCertType}
                                    onChange={
                                        (e) => setNewCertType(
                                            e.target.value,
                                        )
                                    }
                                    label='Endpoint'
                                >
                                    <MenuItem
                                        value='production'
                                    >
                                        Production
                                    </MenuItem>
                                    <MenuItem
                                        value='sandbox'
                                    >
                                        Sandbox
                                    </MenuItem>
                                </Select>
                            </FormControl>
                            <Dropzone
                                multiple={false}
                                accept={
                                    'application/pkcs8,'
                                    + 'application/pkcs10,'
                                    + 'application/pkix-crl,'
                                    + 'application/pkcs7-mime,'
                                    + 'application/x-x509-ca-cert,'
                                    + 'application/x-x509-user-cert,'
                                    + 'application/x-pkcs7-crl,'
                                    + 'application/x-pkcs12,'
                                    + 'application/x-pkcs7-certificates,'
                                    + 'application/x-pkcs7-certreqresp,'
                                    + '.p8,.p10,.cer,.cert,'
                                    + '.p7c,.crt,.der,'
                                    + '.p12,.pfx,.p7b,'
                                    + '.spc,.p7r'
                                }
                                onDrop={(dropFile) => {
                                    const certFile
                                        = dropFile[0];
                                    const rejExts = [
                                        'pem', 'txt',
                                        'jks', 'key',
                                        'ca-bundle',
                                    ];
                                    const ext = certFile
                                        .name.split('.')
                                        .pop();
                                    if (rejExts.includes(
                                        ext,
                                    )) {
                                        setIsCertRejected(
                                            true,
                                        );
                                    } else {
                                        setIsCertRejected(
                                            false,
                                        );
                                    }
                                    if (certFile) {
                                        setNewCertFile(
                                            certFile,
                                        );
                                    }
                                }}
                            >
                                {({
                                    getRootProps,
                                    getInputProps,
                                }) => (
                                    <div
                                        {...getRootProps({
                                            style: {
                                                border:
                                                    '1px dashed'
                                                    + ' #c4c4c4',
                                                borderRadius:
                                                    '5px',
                                                cursor:
                                                    'pointer',
                                                height: 130,
                                                padding:
                                                    '16px 0px',
                                                textAlign:
                                                    'center',
                                                width: '100%',
                                                margin:
                                                    '10px 0',
                                            },
                                        })}
                                    >
                                        <input
                                            {...getInputProps()}
                                        />
                                        <Box
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection:
                                                    'column',
                                                alignItems:
                                                    'center',
                                                justifyContent:
                                                    'center',
                                            }}
                                        >
                                            {!newCertFile
                                                ? (
                                                    <Box>
                                                        <Icon
                                                            sx={{
                                                                fontSize: 56,
                                                            }}
                                                            color='primary'
                                                        >
                                                            cloud_upload
                                                        </Icon>
                                                        <Typography>
                                                            <FormattedMessage
                                                                id={
                                                                    MSG_PREFIX
                                                                    + '.dropCert'
                                                                }
                                                                defaultMessage={
                                                                    'Click or drag the'
                                                                    + ' certificate file'
                                                                    + ' to upload.'
                                                                }
                                                            />
                                                        </Typography>
                                                    </Box>
                                                ) : (
                                                    <Box>
                                                        <InsertDriveFileIcon
                                                            color={
                                                                isCertRejected
                                                                    ? 'error'
                                                                    : 'primary'
                                                            }
                                                            fontSize='large'
                                                        />
                                                        <Typography
                                                            variant='body2'
                                                            color={
                                                                isCertRejected
                                                                    ? 'error'
                                                                    : 'textPrimary'
                                                            }
                                                        >
                                                            {newCertFile.name}
                                                        </Typography>
                                                        {isCertRejected
                                                            && (
                                                                <Typography
                                                                    variant='caption'
                                                                    color='error'
                                                                >
                                                                    <FormattedMessage
                                                                        id={
                                                                            MSG_PREFIX
                                                                            + '.invalidFile'
                                                                        }
                                                                        defaultMessage='Invalid file type'
                                                                    />
                                                                </Typography>
                                                            )}
                                                    </Box>
                                                )}
                                        </Box>
                                    </div>
                                )}
                            </Dropzone>
                            <Button
                                variant='contained'
                                size='small'
                                onClick={
                                    handleAddCertificate
                                }
                                disabled={
                                    !newCertAlias
                                    || !newCertFile
                                    || disableUpdate
                                    || isCertRejected
                                    || (
                                        config
                                            ?.certificates
                                        || []
                                    ).some(
                                        (c) => c.alias
                                            === newCertAlias,
                                    )
                                }
                            >
                                <FormattedMessage
                                    id={
                                        MSG_PREFIX
                                        + '.addCertBtn'
                                    }
                                    defaultMessage='Add'
                                />
                            </Button>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                variant='contained'
                                color='primary'
                                onClick={
                                    () => setCertsDialogOpen(
                                        false,
                                    )
                                }
                            >
                                <FormattedMessage
                                    id={
                                        MSG_PREFIX
                                        + '.certsDone'
                                    }
                                    defaultMessage='Done'
                                />
                            </Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </>
    );
}

ResourceEndpointConfig.propTypes = {
    operation: PropTypes.shape({}).isRequired,
    operationsDispatcher: PropTypes.func.isRequired,
    target: PropTypes.string.isRequired,
    verb: PropTypes.string.isRequired,
    disableUpdate: PropTypes.bool.isRequired,
};
