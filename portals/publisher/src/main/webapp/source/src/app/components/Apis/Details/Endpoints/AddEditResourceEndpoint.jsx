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

import React, { useReducer, useEffect, useState } from 'react';
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
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Icon from '@mui/material/Icon';
import Tooltip from '@mui/material/Tooltip';
import { FormattedMessage } from 'react-intl';

const MSG_PREFIX = 'Apis.Details.Endpoints'
    + '.AddEditResourceEndpoint';

const DEFAULT_STATE = {
    name: '',
    endpoint_type: 'http',
    production_endpoints: { url: '' },
    sandbox_endpoints: { url: '' },
    endpoint_security: {
        production: { type: 'NONE' },
        sandbox: { type: 'NONE' },
    },
    advancedConfig: {},
    certificates: [],
};

function defReducer(state, { field, value }) {
    switch (field) {
        case 'all':
            return { ...value };
        case 'name':
            return { ...state, name: value };
        case 'endpoint_type':
            return { ...state, endpoint_type: value };
        case 'production_url':
            return {
                ...state,
                production_endpoints: {
                    ...state.production_endpoints,
                    url: value,
                },
            };
        case 'sandbox_url':
            return {
                ...state,
                sandbox_endpoints: {
                    ...state.sandbox_endpoints,
                    url: value,
                },
            };
        default:
            return state;
    }
}

/**
 * Dialog for creating or editing a resource endpoint
 * definition. Stores in swagger as part of
 * x-wso2-resource-endpoint-definitions.
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

    const isEditing = !!definition;
    const [state, dispatch] = useReducer(
        defReducer, { ...DEFAULT_STATE },
    );
    const [validating, setValidating] = useState(false);

    useEffect(() => {
        if (open) {
            if (definition) {
                dispatch({
                    field: 'all',
                    value: { ...DEFAULT_STATE, ...definition },
                });
            } else {
                dispatch({
                    field: 'all',
                    value: { ...DEFAULT_STATE },
                });
            }
            setValidating(false);
        }
    }, [open, definition]);

    const nameExists = () => {
        if (!state.name) return false;
        const current = definition?.name || '';
        return existingNames
            .filter((n) => n !== current)
            .some(
                (n) => n.toLowerCase()
                    === state.name.toLowerCase(),
            );
    };

    const hasErrors = () => {
        if (!state.name.trim()) return true;
        if (nameExists()) return true;
        const prodUrl = state.production_endpoints?.url;
        const sandUrl = state.sandbox_endpoints?.url;
        if (!prodUrl && !sandUrl) return true;
        return false;
    };

    const handleSave = () => {
        setValidating(true);
        if (hasErrors()) return;
        const result = { ...state };
        if (definition?.id) {
            result.id = definition.id;
        }
        onSave(result);
    };

    const urlMissing = validating
        && !state.production_endpoints?.url
        && !state.sandbox_endpoints?.url;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='md'
            fullWidth
        >
            <DialogTitle>
                {isEditing
                    ? (
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.titleEdit'
                            }
                            defaultMessage='Edit Resource Endpoint Definition'
                        />
                    )
                    : (
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.titleAdd'
                            }
                            defaultMessage='Add Resource Endpoint Definition'
                        />
                    )}
            </DialogTitle>
            <DialogContent dividers>
                <Grid
                    container
                    spacing={2}
                    sx={{ mt: 0.5 }}
                >
                    {/* Name */}
                    <Grid item xs={12}>
                        <TextField
                            label={(
                                <FormattedMessage
                                    id={
                                        MSG_PREFIX
                                        + '.name'
                                    }
                                    defaultMessage='Name'
                                />
                            )}
                            value={state.name}
                            onChange={(e) => dispatch({
                                field: 'name',
                                value: e.target.value,
                            })}
                            fullWidth
                            size='small'
                            variant='outlined'
                            required
                            error={
                                (validating
                                    && !state.name.trim())
                                || nameExists()
                            }
                            helperText={
                                nameExists()
                                    ? (
                                        <FormattedMessage
                                            id={
                                                MSG_PREFIX
                                                + '.nameExists'
                                            }
                                            defaultMessage={
                                                'A definition'
                                                + ' with this'
                                                + ' name already'
                                                + ' exists'
                                            }
                                        />
                                    )
                                    : (validating
                                        && !state.name.trim()
                                        && (
                                            <FormattedMessage
                                                id={
                                                    MSG_PREFIX
                                                    + '.nameReq'
                                                }
                                                defaultMessage={
                                                    'Name is'
                                                    + ' required'
                                                }
                                            />
                                        ))
                            }
                        />
                    </Grid>

                    {/* Endpoint Type */}
                    <Grid item xs={12}>
                        <FormControl
                            fullWidth
                            size='small'
                            variant='outlined'
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
                                    state.endpoint_type
                                    || 'http'
                                }
                                onChange={(e) => dispatch({
                                    field: 'endpoint_type',
                                    value: e.target.value,
                                })}
                                label='Endpoint Type'
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
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Production URL */}
                    <Grid item xs={6}>
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
                                state
                                    .production_endpoints
                                    ?.url || ''
                            }
                            onChange={(e) => dispatch({
                                field: 'production_url',
                                value: e.target.value,
                            })}
                            fullWidth
                            size='small'
                            variant='outlined'
                            placeholder={
                                'https://production'
                                + '.example.com'
                            }
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
                                            + ' endpoint'
                                            + ' URL'
                                        }
                                    />
                                )
                            }
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment
                                        position='end'
                                    >
                                        <IconButton
                                            size='small'
                                        >
                                            <Tooltip
                                                title={(
                                                    <FormattedMessage
                                                        id={
                                                            MSG_PREFIX
                                                            + '.advConfig'
                                                        }
                                                        defaultMessage='Endpoint configurations'
                                                    />
                                                )}
                                            >
                                                <Icon>
                                                    settings
                                                </Icon>
                                            </Tooltip>
                                        </IconButton>
                                        <IconButton
                                            size='small'
                                        >
                                            <Tooltip
                                                title={(
                                                    <FormattedMessage
                                                        id={
                                                            MSG_PREFIX
                                                            + '.security'
                                                        }
                                                        defaultMessage='Endpoint security'
                                                    />
                                                )}
                                            >
                                                <Icon>
                                                    security
                                                </Icon>
                                            </Tooltip>
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    {/* Sandbox URL */}
                    <Grid item xs={6}>
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
                                state
                                    .sandbox_endpoints
                                    ?.url || ''
                            }
                            onChange={(e) => dispatch({
                                field: 'sandbox_url',
                                value: e.target.value,
                            })}
                            fullWidth
                            size='small'
                            variant='outlined'
                            placeholder={
                                'https://sandbox'
                                + '.example.com'
                            }
                            error={urlMissing}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment
                                        position='end'
                                    >
                                        <IconButton
                                            size='small'
                                        >
                                            <Tooltip
                                                title={(
                                                    <FormattedMessage
                                                        id={
                                                            MSG_PREFIX
                                                            + '.advConfig'
                                                        }
                                                        defaultMessage='Endpoint configurations'
                                                    />
                                                )}
                                            >
                                                <Icon>
                                                    settings
                                                </Icon>
                                            </Tooltip>
                                        </IconButton>
                                        <IconButton
                                            size='small'
                                        >
                                            <Tooltip
                                                title={(
                                                    <FormattedMessage
                                                        id={
                                                            MSG_PREFIX
                                                            + '.security'
                                                        }
                                                        defaultMessage='Endpoint security'
                                                    />
                                                )}
                                            >
                                                <Icon>
                                                    security
                                                </Icon>
                                            </Tooltip>
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    {/* Helper text */}
                    <Grid item xs={12}>
                        <Typography
                            variant='caption'
                            color='textSecondary'
                        >
                            <FormattedMessage
                                id={
                                    MSG_PREFIX
                                    + '.hint'
                                }
                                defaultMessage={
                                    'At least one'
                                    + ' endpoint URL'
                                    + ' (production or'
                                    + ' sandbox) is'
                                    + ' required.'
                                }
                            />
                        </Typography>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>
                    <FormattedMessage
                        id={MSG_PREFIX + '.cancel'}
                        defaultMessage='Cancel'
                    />
                </Button>
                <Button
                    variant='contained'
                    color='primary'
                    onClick={handleSave}
                >
                    {isEditing
                        ? (
                            <FormattedMessage
                                id={
                                    MSG_PREFIX
                                    + '.update'
                                }
                                defaultMessage='Update'
                            />
                        )
                        : (
                            <FormattedMessage
                                id={
                                    MSG_PREFIX
                                    + '.create'
                                }
                                defaultMessage='Create'
                            />
                        )}
                </Button>
            </DialogActions>
        </Dialog>
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
        production_endpoints: PropTypes.shape({
            url: PropTypes.string,
        }),
        sandbox_endpoints: PropTypes.shape({
            url: PropTypes.string,
        }),
    }),
    existingNames: PropTypes.arrayOf(
        PropTypes.string,
    ).isRequired,
    onSave: PropTypes.func.isRequired,
};
