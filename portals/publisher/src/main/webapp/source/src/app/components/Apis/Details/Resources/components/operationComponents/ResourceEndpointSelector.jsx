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

import React from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import HelpOutline from '@mui/icons-material/HelpOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

const DEFS_KEY = 'x-wso2-resource-endpoint-definitions';
const REF_KEY = 'x-wso2-resource-endpoint-ref';
const PRIMARY_KEY = 'x-wso2-primary-endpoint-ref';

const MSG_PREFIX = 'Apis.Details.Resources.components'
    + '.operationComponents.ResourceEndpointSelector';

/**
 * Get endpoint type label.
 *
 * @param {string} epType Endpoint type
 * @returns {string} Label
 */
function getTypeLabel(epType) {
    switch (epType) {
        case 'load_balance': return 'LB';
        case 'failover': return 'FO';
        default: return '';
    }
}

/**
 * Dropdown for assigning a resource endpoint
 * definition to an operation. Rendered inside the
 * Operation accordion on the Resources page.
 *
 * @param {object} props Component props
 * @returns {JSX.Element} Selector component
 */
export default function ResourceEndpointSelector(props) {
    const {
        operation,
        operationsDispatcher,
        target,
        verb,
        spec,
        api,
        disableUpdate,
    } = props;

    const definitions = spec[DEFS_KEY] || [];
    const primaryId = spec[PRIMARY_KEY] || null;
    const currentRef = operation[REF_KEY] || '';

    // Toggle is ON when this operation has a custom endpoint ref
    const isEnabled = !!currentRef;

    // Find the selected definition and extract URLs for display
    const selectedDef = currentRef
        ? definitions.find((d) => d.id === currentRef) : null;
    const selectedUrlHint = (() => {
        if (!selectedDef) return '';
        const cfg = selectedDef.endpointConfig
            || selectedDef;
        const getUrl = (ep) => {
            if (!ep) return '';
            if (Array.isArray(ep)) {
                return (ep[0] || {}).url || '';
            }
            return ep.url || '';
        };
        const prodUrl = getUrl(cfg.production_endpoints);
        const sandUrl = getUrl(cfg.sandbox_endpoints);
        if (prodUrl && sandUrl) {
            return (
                <>
                    {'Prod: ' + prodUrl}
                    <br />
                    {'Sandbox: ' + sandUrl}
                </>
            );
        }
        if (prodUrl) return 'Prod: ' + prodUrl;
        if (sandUrl) return 'Sandbox: ' + sandUrl;
        return '';
    })();

    const handleChange = (event) => {
        const { value } = event.target;
        operationsDispatcher({
            action: 'resourceEndpointRef',
            data: {
                target,
                verb,
                value: value || undefined,
            },
        });
    };

    const handleToggle = () => {
        if (isEnabled) {
            // Turn off: clear the endpoint ref
            operationsDispatcher({
                action: 'resourceEndpointRef',
                data: {
                    target,
                    verb,
                    value: undefined,
                },
            });
        } else {
            // Turn on: set to first available definition
            // (or primary if available)
            const firstDef = primaryId
                || (definitions.length > 0
                    ? definitions[0].id : '');
            if (firstDef) {
                operationsDispatcher({
                    action: 'resourceEndpointRef',
                    data: {
                        target,
                        verb,
                        value: firstDef,
                    },
                });
            }
        }
    };

    return (
        <>
            <Grid item md={12} xs={12}>
                <Typography gutterBottom variant='subtitle1'>
                    <FormattedMessage
                        id={MSG_PREFIX + '.title'}
                        defaultMessage='Endpoint'
                    />
                    <Typography
                        sx={{ ml: 1 }}
                        gutterBottom
                        variant='caption'
                    >
                        (
                        <FormattedMessage
                            id={MSG_PREFIX + '.subtitle'}
                            defaultMessage='Assign an endpoint definition to this operation'
                        />
                        )
                    </Typography>
                    <Divider variant='middle' />
                </Typography>
            </Grid>

            {/* Toggle Switch */}
            <Grid item xs={1} />
            <Grid item xs={11}>
                <FormControl
                    disabled={
                        disableUpdate
                        || definitions.length === 0
                    }
                    component='fieldset'
                >
                    <FormControlLabel
                        control={(
                            <Switch
                                checked={isEnabled}
                                onChange={handleToggle}
                                size='small'
                                color='primary'
                            />
                        )}
                        label={(
                            <FormattedMessage
                                id={MSG_PREFIX + '.toggleLabel'}
                                defaultMessage='Custom Endpoint'
                            />
                        )}
                        labelPlacement='start'
                    />
                </FormControl>
                <sup style={{ marginLeft: '10px' }}>
                    <Tooltip
                        title={(
                            <FormattedMessage
                                id={MSG_PREFIX + '.tooltip'}
                                defaultMessage={
                                    'Override the API-level '
                                    + 'endpoint for this '
                                    + 'resource by assigning a '
                                    + 'custom endpoint definition '
                                    + 'created on the Endpoints '
                                    + 'page.'
                                }
                            />
                        )}
                        fontSize='small'
                        placement='right-end'
                        interactive
                    >
                        <HelpOutline />
                    </Tooltip>
                </sup>
                {definitions.length === 0 && (
                    <Typography
                        variant='caption'
                        color='textSecondary'
                        sx={{ display: 'block', mt: 0.5 }}
                    >
                        <FormattedMessage
                            id={MSG_PREFIX + '.noDefsHelper'}
                            defaultMessage='No endpoint definitions available.'
                        />
                    </Typography>
                )}
            </Grid>

            {/* Create link (shown when no definitions and toggle is OFF) */}
            {definitions.length === 0 && !isEnabled && !disableUpdate && (
                <>
                    <Grid item md={1} xs={1} />
                    <Grid item md={7} xs={7} />
                    <Grid
                        item
                        md={3}
                        xs={3}
                        style={{ marginTop: '14px' }}
                    >
                        <Link
                            to={
                                '/apis/'
                                + api.id
                                + '/endpoints/create'
                            }
                            target='_blank'
                        >
                            <Typography
                                style={{
                                    marginLeft: '10px',
                                }}
                                color='primary'
                                display='inline'
                                variant='caption'
                            >
                                <FormattedMessage
                                    id={
                                        MSG_PREFIX
                                        + '.createFirst'
                                    }
                                    defaultMessage={
                                        'Create New'
                                        + ' Endpoint'
                                    }
                                />
                                <LaunchIcon
                                    style={{
                                        marginLeft: '2px',
                                    }}
                                    fontSize='small'
                                />
                            </Typography>
                        </Link>
                    </Grid>
                </>
            )}

            {/* Endpoint selector (shown when toggle is ON) */}
            {isEnabled && (
                <>
                    <Grid item md={1} xs={1} />
                    <Grid item md={7} xs={7}>
                        <TextField
                            select
                            style={{ width: 500 }}
                            label={(
                                <FormattedMessage
                                    id={MSG_PREFIX + '.label'}
                                    defaultMessage='Endpoint'
                                />
                            )}
                            value={currentRef}
                            onChange={handleChange}
                            disabled={disableUpdate || definitions.length === 0}
                            helperText={
                                // eslint-disable-next-line no-nested-ternary
                                definitions.length === 0
                                    ? (
                                        <FormattedMessage
                                            id={MSG_PREFIX + '.noDefs'}
                                            defaultMessage={
                                                'No endpoint definitions found.'
                                                + ' Create them on the'
                                                + ' Endpoints page first.'
                                            }
                                        />
                                    )
                                    : selectedUrlHint || (
                                        <FormattedMessage
                                            id={MSG_PREFIX + '.hint'}
                                            defaultMessage={
                                                'Select an endpoint'
                                                + ' definition to assign'
                                                + ' to this operation'
                                            }
                                        />
                                    )
                            }
                            margin='dense'
                            variant='outlined'
                        >
                            {definitions.map((def) => {
                                const typeLabel = getTypeLabel(
                                    def.endpoint_type,
                                );
                                return (
                                    <MenuItem key={def.id} value={def.id}>
                                        {def.name}
                                        {def.id === primaryId && (
                                            <Chip
                                                label='Primary'
                                                size='small'
                                                color='primary'
                                                sx={{
                                                    ml: 1,
                                                    height: 20,
                                                    fontSize: '0.7rem',
                                                }}
                                            />
                                        )}
                                        {typeLabel && (
                                            <Chip
                                                label={typeLabel}
                                                size='small'
                                                variant='outlined'
                                                sx={{
                                                    ml: 0.5,
                                                    height: 20,
                                                    fontSize: '0.7rem',
                                                }}
                                            />
                                        )}
                                    </MenuItem>
                                );
                            })}
                        </TextField>
                    </Grid>
                    <Grid
                        item
                        md={3}
                        xs={3}
                        style={{ marginTop: '14px' }}
                    >
                        {!disableUpdate && (
                            <Link
                                to={
                                    '/apis/'
                                    + api.id
                                    + '/endpoints/create'
                                }
                                target='_blank'
                            >
                                <Typography
                                    style={{
                                        marginLeft: '10px',
                                    }}
                                    color='primary'
                                    display='inline'
                                    variant='caption'
                                >
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.createNew'
                                        }
                                        defaultMessage={
                                            'Create New'
                                            + ' Endpoint'
                                        }
                                    />
                                    <LaunchIcon
                                        style={{
                                            marginLeft: '2px',
                                        }}
                                        fontSize='small'
                                    />
                                </Typography>
                            </Link>
                        )}
                    </Grid>
                </>
            )}
        </>
    );
}

ResourceEndpointSelector.defaultProps = {
    disableUpdate: false,
};

ResourceEndpointSelector.propTypes = {
    operation: PropTypes.shape({}).isRequired,
    operationsDispatcher: PropTypes.func.isRequired,
    target: PropTypes.string.isRequired,
    verb: PropTypes.string.isRequired,
    spec: PropTypes.shape({}).isRequired,
    api: PropTypes.shape({
        id: PropTypes.string,
    }).isRequired,
    disableUpdate: PropTypes.bool,
};
