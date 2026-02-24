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

import React from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { FormattedMessage } from 'react-intl';

const DEFS_KEY = 'x-wso2-resource-endpoint-definitions';
const REF_KEY = 'x-wso2-resource-endpoint-ref';
const PRIMARY_KEY = 'x-wso2-primary-endpoint-ref';

const MSG_PREFIX = 'Apis.Details.Resources.components'
    + '.operationComponents.ResourceEndpointSelector';

/**
 * Get primary URL display from a definition, handling HTTP, Load Balance, and Failover types.
 *
 * @param {object} def Endpoint definition
 * @param {string} category 'production' or 'sandbox'
 * @returns {string} Display URL or empty string
 */
function getDisplayUrl(def, category) {
    if (!def) return '';
    const epType = def.endpoint_type || 'http';
    if (category === 'production') {
        if (epType === 'load_balance') {
            const eps = def.production_endpoints;
            if (Array.isArray(eps) && eps.length > 0) {
                const count = eps.filter((e) => e.url).length;
                return eps[0]?.url ? (eps[0].url + (count > 1 ? ' (+' + (count - 1) + ' more)' : '')) : '';
            }
            return '';
        }
        return def.production_endpoints?.url || '';
    }
    if (epType === 'load_balance') {
        const eps = def.sandbox_endpoints;
        if (Array.isArray(eps) && eps.length > 0) {
            const count = eps.filter((e) => e.url).length;
            return eps[0]?.url ? (eps[0].url + (count > 1 ? ' (+' + (count - 1) + ' more)' : '')) : '';
        }
        return '';
    }
    return def.sandbox_endpoints?.url || '';
}

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
        disableUpdate,
    } = props;

    const definitions = spec[DEFS_KEY] || [];
    const primaryId = spec[PRIMARY_KEY] || null;
    const currentRef = operation[REF_KEY] || '';

    const selectedDef = definitions.find((d) => d.id === currentRef);
    const primaryDef = definitions.find((d) => d.id === primaryId);

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
                        <FormattedMessage
                            id={MSG_PREFIX + '.subtitle'}
                            defaultMessage='Assign an endpoint definition to this operation'
                        />
                    </Typography>
                    <Divider variant='middle' />
                </Typography>
            </Grid>
            <Grid item md={1} xs={1} />
            <Grid item md={5} xs={5}>
                <TextField
                    select
                    fullWidth
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
                        definitions.length === 0
                            ? (
                                <FormattedMessage
                                    id={MSG_PREFIX + '.noDefs'}
                                    defaultMessage={'No endpoint definitions found.'
                                        + ' Create them on the Endpoints page first.'}
                                />
                            )
                            : (
                                <FormattedMessage
                                    id={MSG_PREFIX + '.hint'}
                                    defaultMessage='Select an endpoint definition to assign to this operation'
                                />
                            )
                    }
                    margin='dense'
                    variant='outlined'
                    size='small'
                >
                    <MenuItem value=''>
                        <em>
                            <FormattedMessage
                                id={MSG_PREFIX + '.default'}
                                defaultMessage='Use primary endpoint (default)'
                            />
                        </em>
                    </MenuItem>
                    {definitions.map((def) => {
                        const typeLabel = getTypeLabel(def.endpoint_type);
                        return (
                            <MenuItem key={def.id} value={def.id}>
                                {def.name}
                                {def.id === primaryId && (
                                    <Chip
                                        label='Primary'
                                        size='small'
                                        color='primary'
                                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                    />
                                )}
                                {typeLabel && (
                                    <Chip
                                        label={typeLabel}
                                        size='small'
                                        variant='outlined'
                                        sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }}
                                    />
                                )}
                            </MenuItem>
                        );
                    })}
                </TextField>
            </Grid>
            <Grid item md={5} xs={5}>
                {(selectedDef || (!currentRef && primaryDef)) && (
                    <Box sx={{ ml: 2, mt: 1 }}>
                        {!currentRef && primaryDef && (
                            <Typography variant='caption' color='primary' sx={{ mb: 0.5, display: 'block' }}>
                                <FormattedMessage
                                    id={MSG_PREFIX + '.usingPrimary'}
                                    defaultMessage='Using primary endpoint'
                                />
                                {': '}
                                {primaryDef.name}
                            </Typography>
                        )}
                        <Typography variant='body2' color='textSecondary'>
                            <strong>
                                <FormattedMessage
                                    id={MSG_PREFIX + '.prod'}
                                    defaultMessage='Production:'
                                />
                            </strong>
                            {' '}
                            {getDisplayUrl(selectedDef || primaryDef, 'production') || (
                                <FormattedMessage
                                    id={MSG_PREFIX + '.notSet'}
                                    defaultMessage='Not set'
                                />
                            )}
                        </Typography>
                        <Typography variant='body2' color='textSecondary'>
                            <strong>
                                <FormattedMessage
                                    id={MSG_PREFIX + '.sand'}
                                    defaultMessage='Sandbox:'
                                />
                            </strong>
                            {' '}
                            {getDisplayUrl(selectedDef || primaryDef, 'sandbox') || (
                                <FormattedMessage
                                    id={MSG_PREFIX + '.notSet2'}
                                    defaultMessage='Not set'
                                />
                            )}
                        </Typography>
                    </Box>
                )}
            </Grid>
            <Grid item md={1} xs={1} />
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
    disableUpdate: PropTypes.bool,
};
