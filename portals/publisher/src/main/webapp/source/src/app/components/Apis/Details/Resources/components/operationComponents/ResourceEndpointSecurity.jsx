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
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { FormattedMessage, useIntl } from 'react-intl';

const MSG_PREFIX = 'Apis.Details.Resources.operationComponents'
    + '.ResourceEndpointSecurity';

/**
 * Endpoint security configuration for resource-level
 * overrides. Matches the API-level EndpointSecurity dialog
 * with validation, Save button, and eye toggle for secrets.
 *
 * @param {object} props Component props
 * @returns {JSX.Element} Security configuration UI
 */
export default function ResourceEndpointSecurity(props) {
    const {
        security, onUpdate, disabled,
        category: filterCategory,
    } = props;
    const intl = useIntl();

    const [localSecurity, setLocalSecurity] = useState({
        ...security,
    });
    const [validity, setValidity] = useState({});
    const [showApiKey, setShowApiKey] = useState({
        production: false,
        sandbox: false,
    });

    const securityTypes = [
        {
            key: 'NONE',
            value: intl.formatMessage({
                id: MSG_PREFIX + '.type.none',
                defaultMessage: 'None',
            }),
        },
        {
            key: 'BASIC',
            value: intl.formatMessage({
                id: MSG_PREFIX + '.type.basic',
                defaultMessage: 'Basic Auth',
            }),
        },
        {
            key: 'DIGEST',
            value: intl.formatMessage({
                id: MSG_PREFIX + '.type.digest',
                defaultMessage: 'Digest Auth',
            }),
        },
        {
            key: 'OAUTH',
            value: intl.formatMessage({
                id: MSG_PREFIX + '.type.oauth',
                defaultMessage: 'OAuth 2.0',
            }),
        },
        {
            key: 'apikey',
            value: intl.formatMessage({
                id: MSG_PREFIX + '.type.apikey',
                defaultMessage: 'API Key',
            }),
        },
    ];

    const grantTypes = [
        {
            key: 'CLIENT_CREDENTIALS',
            value: intl.formatMessage({
                id: MSG_PREFIX + '.grant.client',
                defaultMessage: 'Client Credentials',
            }),
        },
        {
            key: 'PASSWORD',
            value: intl.formatMessage({
                id: MSG_PREFIX + '.grant.password',
                defaultMessage: 'Resource Owner Password',
            }),
        },
    ];

    // ---- Handlers ----

    const handleTypeChange = (category, newType) => {
        if (newType === 'NONE') {
            setLocalSecurity({
                ...localSecurity,
                [category]: {
                    type: 'NONE',
                    enabled: false,
                },
            });
        } else {
            setLocalSecurity({
                ...localSecurity,
                [category]: {
                    ...localSecurity[category],
                    type: newType,
                    enabled: true,
                },
            });
        }
    };

    const handleFieldChange = (category, field, val) => {
        setLocalSecurity({
            ...localSecurity,
            [category]: {
                ...localSecurity[category],
                [field]: val,
            },
        });
    };

    const validateField = (category, field) => {
        const key = `${category}_${field}`;
        const val = localSecurity[category]?.[field];
        setValidity((prev) => ({
            ...prev,
            [key]: !!val,
        }));
    };

    const isInvalid = (category, field) => {
        const key = `${category}_${field}`;
        return validity[key] === false;
    };

    // Auto-save: call onUpdate whenever localSecurity
    // changes so parent always has the latest values.
    React.useEffect(() => {
        onUpdate(localSecurity);
    }, [localSecurity]); // eslint-disable-line

    // ---- Render helpers ----

    const renderSecuritySection = (category, title) => {
        const config = localSecurity[category]
            || { type: 'NONE', enabled: false };
        const secType = config.type || 'NONE';

        return (
            <>
                <Grid item xs={12}>
                    <Typography
                        variant='body1'
                        gutterBottom
                    >
                        {title}
                    </Typography>
                </Grid>

                {/* Security Type */}
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        select
                        variant='outlined'
                        size='small'
                        value={secType}
                        onChange={
                            (e) => handleTypeChange(
                                category,
                                e.target.value,
                            )
                        }
                        disabled={disabled}
                    >
                        {securityTypes.map((t) => (
                            <MenuItem
                                key={t.key}
                                value={t.key}
                            >
                                {t.value}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid item xs={6} />

                {/* Basic / Digest fields */}
                {(secType === 'BASIC'
                    || secType === 'DIGEST')
                    && (
                        <>
                            <Grid item xs={6}>
                                <TextField
                                    required
                                    fullWidth
                                    size='small'
                                    variant='outlined'
                                    label={(
                                        <FormattedMessage
                                            id={
                                                MSG_PREFIX
                                                + '.username'
                                            }
                                            defaultMessage='Username'
                                        />
                                    )}
                                    value={
                                        config.username
                                        || ''
                                    }
                                    onChange={
                                        (e) => handleFieldChange(
                                            category,
                                            'username',
                                            e.target.value,
                                        )
                                    }
                                    onBlur={
                                        () => validateField(
                                            category,
                                            'username',
                                        )
                                    }
                                    error={isInvalid(
                                        category,
                                        'username',
                                    )}
                                    helperText={
                                        isInvalid(
                                            category,
                                            'username',
                                        )
                                            ? intl.formatMessage({
                                                id:
                                                    MSG_PREFIX
                                                    + '.username'
                                                    + '.error',
                                                defaultMessage:
                                                    'Username '
                                                    + 'should not'
                                                    + ' be empty',
                                            })
                                            : intl.formatMessage({
                                                id:
                                                    MSG_PREFIX
                                                    + '.username'
                                                    + '.helper',
                                                defaultMessage:
                                                    'Enter '
                                                    + 'Username',
                                            })
                                    }
                                    disabled={disabled}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField
                                    required
                                    fullWidth
                                    size='small'
                                    variant='outlined'
                                    type='password'
                                    label={(
                                        <FormattedMessage
                                            id={
                                                MSG_PREFIX
                                                + '.password'
                                            }
                                            defaultMessage='Password'
                                        />
                                    )}
                                    value={
                                        config.password
                                        || ''
                                    }
                                    onChange={
                                        (e) => handleFieldChange(
                                            category,
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    onBlur={
                                        () => validateField(
                                            category,
                                            'password',
                                        )
                                    }
                                    error={isInvalid(
                                        category,
                                        'password',
                                    )}
                                    helperText={
                                        isInvalid(
                                            category,
                                            'password',
                                        )
                                            ? intl.formatMessage({
                                                id:
                                                    MSG_PREFIX
                                                    + '.password'
                                                    + '.error',
                                                defaultMessage:
                                                    'Password '
                                                    + 'should not'
                                                    + ' be empty',
                                            })
                                            : intl.formatMessage({
                                                id:
                                                    MSG_PREFIX
                                                    + '.password'
                                                    + '.helper',
                                                defaultMessage:
                                                    'Enter '
                                                    + 'Password',
                                            })
                                    }
                                    disabled={disabled}
                                    InputProps={{
                                        autoComplete:
                                            'new-password',
                                    }}
                                />
                            </Grid>
                        </>
                    )}

                {/* OAuth 2.0 fields */}
                {secType === 'OAUTH' && (
                    <>
                        <Grid item xs={6}>
                            <TextField
                                required
                                fullWidth
                                select
                                size='small'
                                variant='outlined'
                                label={(
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.grantType'
                                        }
                                        defaultMessage='Grant Type'
                                    />
                                )}
                                value={
                                    config.grantType
                                    || 'CLIENT_CREDENTIALS'
                                }
                                onChange={
                                    (e) => handleFieldChange(
                                        category,
                                        'grantType',
                                        e.target.value,
                                    )
                                }
                                disabled={disabled}
                            >
                                {grantTypes.map((gt) => (
                                    <MenuItem
                                        key={gt.key}
                                        value={gt.key}
                                    >
                                        {gt.value}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                required
                                fullWidth
                                size='small'
                                variant='outlined'
                                label={(
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.tokenUrl'
                                        }
                                        defaultMessage='Token URL'
                                    />
                                )}
                                value={
                                    config.tokenUrl || ''
                                }
                                onChange={
                                    (e) => handleFieldChange(
                                        category,
                                        'tokenUrl',
                                        e.target.value,
                                    )
                                }
                                onBlur={
                                    () => validateField(
                                        category,
                                        'tokenUrl',
                                    )
                                }
                                error={isInvalid(
                                    category,
                                    'tokenUrl',
                                )}
                                helperText={
                                    isInvalid(
                                        category,
                                        'tokenUrl',
                                    )
                                        ? intl.formatMessage({
                                            id:
                                                MSG_PREFIX
                                                + '.tokenUrl'
                                                + '.error',
                                            defaultMessage:
                                                'Token URL '
                                                + 'should not'
                                                + ' be empty',
                                        })
                                        : intl.formatMessage({
                                            id:
                                                MSG_PREFIX
                                                + '.tokenUrl'
                                                + '.helper',
                                            defaultMessage:
                                                'Enter '
                                                + 'Token URL',
                                        })
                                }
                                disabled={disabled}
                                placeholder={
                                    'https://auth'
                                    + '.example.com/token'
                                }
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                required
                                fullWidth
                                size='small'
                                variant='outlined'
                                label={(
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.clientId'
                                        }
                                        defaultMessage='Client ID'
                                    />
                                )}
                                value={
                                    config.clientId || ''
                                }
                                onChange={
                                    (e) => handleFieldChange(
                                        category,
                                        'clientId',
                                        e.target.value,
                                    )
                                }
                                onBlur={
                                    () => validateField(
                                        category,
                                        'clientId',
                                    )
                                }
                                error={isInvalid(
                                    category,
                                    'clientId',
                                )}
                                helperText={
                                    isInvalid(
                                        category,
                                        'clientId',
                                    )
                                        ? intl.formatMessage({
                                            id:
                                                MSG_PREFIX
                                                + '.clientId'
                                                + '.error',
                                            defaultMessage:
                                                'Client ID '
                                                + 'should not'
                                                + ' be empty',
                                        })
                                        : intl.formatMessage({
                                            id:
                                                MSG_PREFIX
                                                + '.clientId'
                                                + '.helper',
                                            defaultMessage:
                                                'Enter '
                                                + 'Client ID',
                                        })
                                }
                                disabled={disabled}
                                InputProps={{
                                    autoComplete:
                                        'new-password',
                                }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                required
                                fullWidth
                                size='small'
                                variant='outlined'
                                type='password'
                                label={(
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.clientSecret'
                                        }
                                        defaultMessage='Client Secret'
                                    />
                                )}
                                value={
                                    config.clientSecret
                                    || ''
                                }
                                onChange={
                                    (e) => handleFieldChange(
                                        category,
                                        'clientSecret',
                                        e.target.value,
                                    )
                                }
                                onBlur={
                                    () => validateField(
                                        category,
                                        'clientSecret',
                                    )
                                }
                                error={isInvalid(
                                    category,
                                    'clientSecret',
                                )}
                                helperText={
                                    isInvalid(
                                        category,
                                        'clientSecret',
                                    )
                                        ? intl.formatMessage({
                                            id:
                                                MSG_PREFIX
                                                + '.clientSecret'
                                                + '.error',
                                            defaultMessage:
                                                'Client Secret'
                                                + ' should not'
                                                + ' be empty',
                                        })
                                        : intl.formatMessage({
                                            id:
                                                MSG_PREFIX
                                                + '.clientSecret'
                                                + '.helper',
                                            defaultMessage:
                                                'Enter Client'
                                                + ' Secret',
                                        })
                                }
                                disabled={disabled}
                                InputProps={{
                                    autoComplete:
                                        'new-password',
                                }}
                            />
                        </Grid>
                        {config.grantType === 'PASSWORD'
                            && (
                                <>
                                    <Grid item xs={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            size='small'
                                            variant='outlined'
                                            label={(
                                                <FormattedMessage
                                                    id={
                                                        MSG_PREFIX
                                                        + '.username'
                                                    }
                                                    defaultMessage='Username'
                                                />
                                            )}
                                            value={
                                                config
                                                    .username
                                                || ''
                                            }
                                            onChange={
                                                (e) => handleFieldChange(
                                                    category,
                                                    'username',
                                                    e.target
                                                        .value,
                                                )
                                            }
                                            onBlur={
                                                () => validateField(
                                                    category,
                                                    'username',
                                                )
                                            }
                                            error={
                                                isInvalid(
                                                    category,
                                                    'username',
                                                )
                                            }
                                            helperText={
                                                isInvalid(
                                                    category,
                                                    'username',
                                                )
                                                    ? intl.formatMessage({
                                                        id:
                                                            MSG_PREFIX
                                                            + '.username'
                                                            + '.error',
                                                        defaultMessage:
                                                            'Username'
                                                            + ' should'
                                                            + ' not be'
                                                            + ' empty',
                                                    })
                                                    : intl.formatMessage({
                                                        id:
                                                            MSG_PREFIX
                                                            + '.username'
                                                            + '.helper',
                                                        defaultMessage:
                                                            'Enter'
                                                            + ' Username',
                                                    })
                                            }
                                            disabled={
                                                disabled
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            required
                                            fullWidth
                                            size='small'
                                            variant='outlined'
                                            type='password'
                                            label={(
                                                <FormattedMessage
                                                    id={
                                                        MSG_PREFIX
                                                        + '.password'
                                                    }
                                                    defaultMessage='Password'
                                                />
                                            )}
                                            value={
                                                config
                                                    .password
                                                || ''
                                            }
                                            onChange={
                                                (e) => handleFieldChange(
                                                    category,
                                                    'password',
                                                    e.target
                                                        .value,
                                                )
                                            }
                                            onBlur={
                                                () => validateField(
                                                    category,
                                                    'password',
                                                )
                                            }
                                            error={
                                                isInvalid(
                                                    category,
                                                    'password',
                                                )
                                            }
                                            helperText={
                                                isInvalid(
                                                    category,
                                                    'password',
                                                )
                                                    ? intl.formatMessage({
                                                        id:
                                                            MSG_PREFIX
                                                            + '.password'
                                                            + '.error',
                                                        defaultMessage:
                                                            'Password'
                                                            + ' should'
                                                            + ' not be'
                                                            + ' empty',
                                                    })
                                                    : intl.formatMessage({
                                                        id:
                                                            MSG_PREFIX
                                                            + '.password'
                                                            + '.helper',
                                                        defaultMessage:
                                                            'Enter'
                                                            + ' Password',
                                                    })
                                            }
                                            disabled={
                                                disabled
                                            }
                                            InputProps={{
                                                autoComplete:
                                                    'new-password',
                                            }}
                                        />
                                    </Grid>
                                </>
                            )}
                    </>
                )}

                {/* API Key fields */}
                {secType === 'apikey' && (
                    <>
                        <Grid item xs={6}>
                            <TextField
                                required
                                fullWidth
                                select
                                size='small'
                                variant='outlined'
                                label={(
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.apiKeyIdType'
                                        }
                                        defaultMessage={
                                            'API Key'
                                            + ' Identifier'
                                            + ' Type'
                                        }
                                    />
                                )}
                                value={
                                    config
                                        .apiKeyIdentifierType
                                    || 'HEADER'
                                }
                                onChange={
                                    (e) => handleFieldChange(
                                        category,
                                        'apiKeyIdentifierType',
                                        e.target.value,
                                    )
                                }
                                helperText={
                                    intl.formatMessage({
                                        id:
                                            MSG_PREFIX
                                            + '.apiKeyIdType'
                                            + '.helper',
                                        defaultMessage:
                                            'Select where'
                                            + ' the API Key'
                                            + ' is sent',
                                    })
                                }
                                disabled={disabled}
                            >
                                <MenuItem value='HEADER'>
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.header'
                                        }
                                        defaultMessage='Header'
                                    />
                                </MenuItem>
                                <MenuItem
                                    value='QUERY_PARAMETER'
                                >
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.queryParam'
                                        }
                                        defaultMessage={
                                            'Query'
                                            + ' Parameter'
                                        }
                                    />
                                </MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                required
                                fullWidth
                                size='small'
                                variant='outlined'
                                label={(
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.apiKeyId'
                                        }
                                        defaultMessage={
                                            'API Key'
                                            + ' Identifier'
                                        }
                                    />
                                )}
                                value={
                                    config
                                        .apiKeyIdentifier
                                    || ''
                                }
                                onChange={
                                    (e) => handleFieldChange(
                                        category,
                                        'apiKeyIdentifier',
                                        e.target.value,
                                    )
                                }
                                onBlur={
                                    () => validateField(
                                        category,
                                        'apiKeyIdentifier',
                                    )
                                }
                                error={isInvalid(
                                    category,
                                    'apiKeyIdentifier',
                                )}
                                helperText={
                                    isInvalid(
                                        category,
                                        'apiKeyIdentifier',
                                    )
                                        ? intl.formatMessage({
                                            id:
                                                MSG_PREFIX
                                                + '.apiKeyId'
                                                + '.error',
                                            defaultMessage:
                                                'API Key'
                                                + ' Identifier'
                                                + ' should not'
                                                + ' be empty',
                                        })
                                        : intl.formatMessage({
                                            id:
                                                MSG_PREFIX
                                                + '.apiKeyId'
                                                + '.helper',
                                            defaultMessage:
                                                'e.g.,'
                                                + ' X-API-Key,'
                                                + ' api_key',
                                        })
                                }
                                disabled={disabled}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                size='small'
                                variant='outlined'
                                type={
                                    showApiKey[category]
                                        ? 'text'
                                        : 'password'
                                }
                                label={(
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.apiKeyValue'
                                        }
                                        defaultMessage={
                                            'API Key'
                                            + ' Value'
                                        }
                                    />
                                )}
                                value={
                                    config.apiKeyValue
                                    || ''
                                }
                                onChange={
                                    (e) => handleFieldChange(
                                        category,
                                        'apiKeyValue',
                                        e.target.value,
                                    )
                                }
                                onBlur={
                                    () => validateField(
                                        category,
                                        'apiKeyValue',
                                    )
                                }
                                error={isInvalid(
                                    category,
                                    'apiKeyValue',
                                )}
                                helperText={
                                    isInvalid(
                                        category,
                                        'apiKeyValue',
                                    )
                                        ? intl.formatMessage({
                                            id:
                                                MSG_PREFIX
                                                + '.apiKeyValue'
                                                + '.error',
                                            defaultMessage:
                                                'API Key Value'
                                                + ' should not'
                                                + ' be empty',
                                        })
                                        : intl.formatMessage({
                                            id:
                                                MSG_PREFIX
                                                + '.apiKeyValue'
                                                + '.helper',
                                            defaultMessage:
                                                'Enter API'
                                                + ' Key Value',
                                        })
                                }
                                disabled={disabled}
                                InputProps={{
                                    autoComplete:
                                        'new-password',
                                    endAdornment: (
                                        <IconButton
                                            size='small'
                                            onClick={
                                                () => setShowApiKey(
                                                    (prev) => ({
                                                        ...prev,
                                                        [category]:
                                                            !prev[
                                                                category
                                                            ],
                                                    }),
                                                )
                                            }
                                            edge='end'
                                        >
                                            {showApiKey[
                                                category
                                            ]
                                                ? (
                                                    <Visibility
                                                        fontSize='small'
                                                    />
                                                )
                                                : (
                                                    <VisibilityOff
                                                        fontSize='small'
                                                    />
                                                )}
                                        </IconButton>
                                    ),
                                }}
                            />
                        </Grid>
                    </>
                )}
            </>
        );
    };

    // ---- Main Render ----

    const showProd = !filterCategory
        || filterCategory === 'production';
    const showSand = !filterCategory
        || filterCategory === 'sandbox';

    return (
        <Grid container spacing={2}>
            {showProd && renderSecuritySection(
                'production',
                (
                    <FormattedMessage
                        id={
                            MSG_PREFIX
                            + '.productionTitle'
                        }
                        defaultMessage={
                            'Production Endpoint'
                            + ' Security'
                        }
                    />
                ),
            )}

            {showProd && showSand && (
                <Grid item xs={12} sx={{ mt: 1 }}>
                    <Divider />
                </Grid>
            )}

            {showSand && renderSecuritySection(
                'sandbox',
                (
                    <FormattedMessage
                        id={
                            MSG_PREFIX
                            + '.sandboxTitle'
                        }
                        defaultMessage={
                            'Sandbox Endpoint'
                            + ' Security'
                        }
                    />
                ),
            )}
        </Grid>
    );
}

ResourceEndpointSecurity.propTypes = {
    security: PropTypes.shape({}).isRequired,
    onUpdate: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired,
    category: PropTypes.string,
};

ResourceEndpointSecurity.defaultProps = {
    category: null,
};
