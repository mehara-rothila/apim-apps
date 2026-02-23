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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import { FormattedMessage, useIntl } from 'react-intl';

const MSG_PREFIX = 'Apis.Details.Resources.operationComponents'
    + '.ResourceAdvancedConfig';

const MENU_PROPS = {
    PaperProps: {
        style: { maxHeight: (48 * 4.5) + 8, width: 250 },
    },
};

/**
 * Advanced endpoint configuration for resource-level
 * overrides. Matches the API-level AdvanceEndpointConfig
 * dialog layout: Suspension → Timeout → Connection Timeout.
 *
 * @param {object} props Component props
 * @returns {JSX.Element} Advanced configuration UI
 */
export default function ResourceAdvancedConfig(props) {
    const { config, onUpdate, disabled } = props;
    const intl = useIntl();

    const [localConfig, setLocalConfig] = useState({
        ...config,
    });

    const errorCodes = [
        {
            key: '101001',
            value: '101001 : ' + intl.formatMessage({
                id: MSG_PREFIX + '.err.101001',
                defaultMessage: 'Receiver IO Error Receiving',
            }),
        },
        {
            key: '101500',
            value: '101500 : ' + intl.formatMessage({
                id: MSG_PREFIX + '.err.101500',
                defaultMessage: 'Sender IO Error Sending',
            }),
        },
        {
            key: '101000',
            value: '101000 : ' + intl.formatMessage({
                id: MSG_PREFIX + '.err.101000',
                defaultMessage: 'Retriever IO Error Sending',
            }),
        },
        {
            key: '101501',
            value: '101501 : ' + intl.formatMessage({
                id: MSG_PREFIX + '.err.101501',
                defaultMessage: 'Sender IO Error Receiving',
            }),
        },
        {
            key: '101503',
            value: '101503 : ' + intl.formatMessage({
                id: MSG_PREFIX + '.err.101503',
                defaultMessage: 'Connection Failed',
            }),
        },
        {
            key: '101504',
            value: '101504 : ' + intl.formatMessage({
                id: MSG_PREFIX + '.err.101504',
                defaultMessage: 'Connection Timed Out',
            }),
        },
        {
            key: '101505',
            value: '101505 : ' + intl.formatMessage({
                id: MSG_PREFIX + '.err.101505',
                defaultMessage: 'Connection Closed',
            }),
        },
        {
            key: '101506',
            value: '101506 : ' + intl.formatMessage({
                id: MSG_PREFIX + '.err.101506',
                defaultMessage: 'HTTP Protocol Violation',
            }),
        },
        {
            key: '101507',
            value: '101507 : ' + intl.formatMessage({
                id: MSG_PREFIX + '.err.101507',
                defaultMessage: 'Connect Cancel',
            }),
        },
        {
            key: '101508',
            value: '101508 : ' + intl.formatMessage({
                id: MSG_PREFIX + '.err.101508',
                defaultMessage: 'Connect Timeout',
            }),
        },
        {
            key: '101509',
            value: '101509 : ' + intl.formatMessage({
                id: MSG_PREFIX + '.err.101509',
                defaultMessage: 'Send Abort',
            }),
        },
        {
            key: '101510',
            value: '101510 : ' + intl.formatMessage({
                id: MSG_PREFIX + '.err.101510',
                defaultMessage: 'Response Processing Failure',
            }),
        },
    ];

    const handleChange = (field, val) => {
        setLocalConfig({ ...localConfig, [field]: val });
    };

    const validateNumber = (event) => {
        const regex = /(^\d*$)|(Backspace|Tab|Delete|ArrowLeft|ArrowRight)/;
        if (!event.key.match(regex)) {
            event.preventDefault();
        }
    };

    // Auto-save: call onUpdate whenever localConfig
    // changes so parent always has the latest values.
    React.useEffect(() => {
        onUpdate(localConfig);
    }, [localConfig]); // eslint-disable-line

    const renderErrorCodeSelect = (field, value) => (
        <FormControl fullWidth size='small'>
            <InputLabel>
                <FormattedMessage
                    id={MSG_PREFIX + '.errorCode'}
                    defaultMessage='Error Code'
                />
            </InputLabel>
            <Select
                multiple
                value={value || []}
                onChange={
                    (e) => handleChange(
                        field, e.target.value,
                    )
                }
                label='Error Code'
                disabled={disabled}
                MenuProps={MENU_PROPS}
                renderValue={
                    (selected) => selected.map(
                        (s) => {
                            const found = errorCodes.find(
                                (c) => c.key === s,
                            );
                            return found
                                ? found.value : s;
                        },
                    ).join(', ')
                }
            >
                {errorCodes.map((code) => (
                    <MenuItem
                        key={code.key}
                        value={code.key}
                    >
                        <Checkbox
                            checked={
                                (value || [])
                                    .indexOf(code.key)
                                > -1
                            }
                            color='primary'
                            size='small'
                        />
                        <ListItemText
                            primary={code.value}
                        />
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    return (
        <Grid container spacing={2}>
            {/* Endpoint Suspension State */}
            <Grid item xs={12}>
                <Typography
                    variant='body1'
                    gutterBottom
                >
                    <FormattedMessage
                        id={MSG_PREFIX + '.suspension'}
                        defaultMessage={
                            'Endpoint Suspension'
                            + ' State'
                        }
                    />
                </Typography>
            </Grid>
            <Grid item xs={12}>
                {renderErrorCodeSelect(
                    'suspendErrorCode',
                    localConfig.suspendErrorCode,
                )}
            </Grid>
            <Grid item xs={4}>
                <TextField
                    label={(
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.initialDuration'
                            }
                            defaultMessage={
                                'Initial Duration'
                                + ' (ms)'
                            }
                        />
                    )}
                    type='number'
                    value={
                        localConfig.suspendDuration
                        || ''
                    }
                    onKeyDown={validateNumber}
                    onChange={
                        (e) => handleChange(
                            'suspendDuration',
                            e.target.value,
                        )
                    }
                    fullWidth
                    size='small'
                    variant='outlined'
                    disabled={disabled}
                />
            </Grid>
            <Grid item xs={4}>
                <TextField
                    label={(
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.maxDuration'
                            }
                            defaultMessage={
                                'Max Duration'
                                + ' (ms)'
                            }
                        />
                    )}
                    type='number'
                    value={
                        localConfig.suspendMaxDuration
                        || ''
                    }
                    onKeyDown={validateNumber}
                    onChange={
                        (e) => handleChange(
                            'suspendMaxDuration',
                            e.target.value,
                        )
                    }
                    fullWidth
                    size='small'
                    variant='outlined'
                    disabled={disabled}
                />
            </Grid>
            <Grid item xs={4}>
                <TextField
                    label={(
                        <FormattedMessage
                            id={MSG_PREFIX + '.factor'}
                            defaultMessage='Factor'
                        />
                    )}
                    type='number'
                    value={
                        localConfig.factor || ''
                    }
                    onKeyDown={validateNumber}
                    onChange={
                        (e) => handleChange(
                            'factor', e.target.value,
                        )
                    }
                    fullWidth
                    size='small'
                    variant='outlined'
                    disabled={disabled}
                />
            </Grid>

            {/* Endpoint Timeout State */}
            <Grid item xs={12} sx={{ mt: 1 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography
                    variant='body1'
                    gutterBottom
                >
                    <FormattedMessage
                        id={MSG_PREFIX + '.timeoutState'}
                        defaultMessage={
                            'Endpoint Timeout'
                            + ' State'
                        }
                    />
                </Typography>
            </Grid>
            <Grid item xs={12}>
                {renderErrorCodeSelect(
                    'retryErroCode',
                    localConfig.retryErroCode,
                )}
            </Grid>
            <Grid item xs={6}>
                <TextField
                    label={(
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.retriesBefore'
                            }
                            defaultMessage={
                                'Retries Before'
                                + ' Suspension'
                            }
                        />
                    )}
                    type='number'
                    value={
                        localConfig.retryTimeOut || ''
                    }
                    onKeyDown={validateNumber}
                    onChange={
                        (e) => handleChange(
                            'retryTimeOut',
                            e.target.value,
                        )
                    }
                    fullWidth
                    size='small'
                    variant='outlined'
                    disabled={disabled}
                />
            </Grid>
            <Grid item xs={6}>
                <TextField
                    label={(
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.retryDelay'
                            }
                            defaultMessage={
                                'Retry Delay'
                                + ' (ms)'
                            }
                        />
                    )}
                    type='number'
                    value={
                        localConfig.retryDelay || ''
                    }
                    onKeyDown={validateNumber}
                    onChange={
                        (e) => handleChange(
                            'retryDelay',
                            e.target.value,
                        )
                    }
                    fullWidth
                    size='small'
                    variant='outlined'
                    disabled={disabled}
                />
            </Grid>

            {/* Connection Timeout */}
            <Grid item xs={12} sx={{ mt: 1 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography
                    variant='body1'
                    gutterBottom
                >
                    <FormattedMessage
                        id={
                            MSG_PREFIX
                            + '.connectionTimeout'
                        }
                        defaultMessage='Connection Timeout'
                    />
                </Typography>
            </Grid>
            <Grid item xs={6}>
                <FormControl
                    fullWidth
                    size='small'
                    variant='outlined'
                >
                    <InputLabel>
                        <FormattedMessage
                            id={MSG_PREFIX + '.action'}
                            defaultMessage='Action'
                        />
                    </InputLabel>
                    <Select
                        value={
                            localConfig.actionSelect
                            || 'fault'
                        }
                        onChange={
                            (e) => handleChange(
                                'actionSelect',
                                e.target.value,
                            )
                        }
                        label='Action'
                        disabled={disabled}
                    >
                        <MenuItem value='fault'>
                            <FormattedMessage
                                id={
                                    MSG_PREFIX
                                    + '.fault'
                                }
                                defaultMessage={
                                    'Execute Fault'
                                    + ' Sequence'
                                }
                            />
                        </MenuItem>
                        <MenuItem value='discard'>
                            <FormattedMessage
                                id={
                                    MSG_PREFIX
                                    + '.discard'
                                }
                                defaultMessage={
                                    'Discard'
                                    + ' Message'
                                }
                            />
                        </MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={6}>
                <TextField
                    label={(
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.duration'
                            }
                            defaultMessage='Duration (ms)'
                        />
                    )}
                    type='number'
                    value={
                        localConfig.actionDuration
                        || '30000'
                    }
                    onKeyDown={validateNumber}
                    onChange={
                        (e) => handleChange(
                            'actionDuration',
                            e.target.value,
                        )
                    }
                    fullWidth
                    size='small'
                    variant='outlined'
                    disabled={disabled}
                />
            </Grid>

        </Grid>
    );
}

ResourceAdvancedConfig.propTypes = {
    config: PropTypes.shape({}).isRequired,
    onUpdate: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired,
};
