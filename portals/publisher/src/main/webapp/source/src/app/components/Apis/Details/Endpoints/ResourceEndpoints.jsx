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
import { styled } from '@mui/material/styles';
import {
    Typography,
    Paper,
    Chip,
    Box,
    Icon,
    Divider,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

const PREFIX = 'ResourceEndpoints';

const EXTENSION_KEY = 'x-wso2-resource-endpoint-config';

const classes = {
    paperWrapper: `${PREFIX}-paperWrapper`,
    resourceRow: `${PREFIX}-resourceRow`,
    methodChip: `${PREFIX}-methodChip`,
};

const Root = styled('div')(({ theme }) => ({
    [`& .${classes.paperWrapper}`]: {
        padding: theme.spacing(3),
    },
    [`& .${classes.resourceRow}`]: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing(1.5, 0),
        '&:not(:last-child)': {
            borderBottom:
                '1px solid '
                + theme.palette.divider,
        },
    },
    [`& .${classes.methodChip}`]: {
        marginRight: theme.spacing(1.5),
        fontWeight: 600,
        minWidth: 72,
        fontSize: '0.75rem',
    },
}));

const methodColors = {
    GET: '#61affe',
    POST: '#49cc90',
    PUT: '#fca130',
    DELETE: '#f93e3e',
    PATCH: '#50e3c2',
    HEAD: '#9012fe',
    OPTIONS: '#0d5aa7',
};

const endpointTypeLabels = {
    http: 'HTTP',
    load_balance: 'Load Balanced',
    failover: 'Failover',
};

/**
 * Resource-level endpoint summary on the Endpoints page.
 * Shows which resources have custom endpoint configs
 * configured from the Resources page.
 *
 * @param {object} props Component props
 * @returns {JSX.Element} The resource endpoints summary
 */
function ResourceEndpoints(props) {
    const { api, swaggerDef } = props;

    const getConfiguredResources = () => {
        const resources = [];
        if (swaggerDef && swaggerDef.paths) {
            const methods = [
                'get', 'post', 'put', 'delete',
                'patch', 'head', 'options',
            ];
            Object.keys(swaggerDef.paths).forEach(
                (path) => {
                    const pathItem
                        = swaggerDef.paths[path];
                    Object.keys(pathItem).forEach(
                        (method) => {
                            if (
                                methods.includes(method)
                            ) {
                                const op
                                    = pathItem[method];
                                if (op[EXTENSION_KEY]) {
                                    resources.push({
                                        target: path,
                                        verb: method
                                            .toUpperCase(),
                                        config:
                                            op[
                                                EXTENSION_KEY
                                            ],
                                    });
                                }
                            }
                        },
                    );
                },
            );
        }
        return resources;
    };

    const configured = getConfiguredResources();

    if (configured.length === 0) {
        return null;
    }

    const resourcesUrl = `/apis/${api.id}/resources`;

    return (
        <Root>
            <Typography
                variant='h4'
                align='left'
                gutterBottom
            >
                <FormattedMessage
                    id={
                        'Apis.Details.Endpoints.'
                        + 'ResourceEndpoints.title'
                    }
                    defaultMessage={
                        'Resource-Level Endpoint'
                        + ' Overrides'
                    }
                />
            </Typography>
            <Paper
                className={classes.paperWrapper}
                elevation={0}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 2,
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor:
                            'rgba(2, 136, 209, 0.08)',
                    }}
                >
                    <Icon
                        color='primary'
                        sx={{ mr: 1 }}
                    >
                        info
                    </Icon>
                    <Typography
                        variant='body2'
                        color='textSecondary'
                    >
                        <FormattedMessage
                            id={
                                'Apis.Details'
                                + '.Endpoints'
                                + '.ResourceEndpoints'
                                + '.summary'
                            }
                            defaultMessage={
                                '{count} resource(s)'
                                + ' have custom endpoint'
                                + ' configurations.'
                                + ' Manage them from'
                                + ' the {link}.'
                            }
                            values={{
                                count: configured.length,
                                link: (
                                    <Link
                                        to={resourcesUrl}
                                        style={{
                                            color:
                                                '#1a73e8',
                                            textDecoration:
                                                'none',
                                            fontWeight:
                                                500,
                                        }}
                                    >
                                        <FormattedMessage
                                            id={
                                                'Apis'
                                                + '.Details'
                                                + '.Endpoints'
                                                + '.Resource'
                                                + 'Endpoints'
                                                + '.resLink'
                                            }
                                            defaultMessage='Resources page'
                                        />
                                    </Link>
                                ),
                            }}
                        />
                    </Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />
                {configured.map((res) => {
                    const cfg = res.config;
                    const epType = endpointTypeLabels[
                        cfg.endpoint_type
                    ] || cfg.endpoint_type;
                    const prodUrl
                        = Array.isArray(
                            cfg.production_endpoints,
                        )
                            ? (cfg
                                .production_endpoints[0]
                                ?.url || '')
                            : (cfg.production_endpoints
                                ?.url || '');
                    const sandUrl
                        = Array.isArray(
                            cfg.sandbox_endpoints,
                        )
                            ? (cfg
                                .sandbox_endpoints[0]
                                ?.url || '')
                            : (cfg.sandbox_endpoints
                                ?.url || '');
                    const hasSecurity
                        = cfg.endpoint_security
                        && (
                            cfg.endpoint_security
                                .production?.type
                                !== 'NONE'
                            || cfg.endpoint_security
                                .sandbox?.type
                                !== 'NONE'
                        );
                    const certCount
                        = (cfg.certificates || [])
                            .length;

                    return (
                        <Box
                            key={
                                `${res.verb}`
                                + `_${res.target}`
                            }
                            className={
                                classes.resourceRow
                            }
                        >
                            <Box
                                display='flex'
                                alignItems='center'
                            >
                                <Chip
                                    label={res.verb}
                                    size='small'
                                    className={
                                        classes
                                            .methodChip
                                    }
                                    style={{
                                        backgroundColor:
                                            methodColors[
                                                res.verb
                                            ] || '#999',
                                        color: '#fff',
                                    }}
                                />
                                <Typography
                                    variant='subtitle2'
                                >
                                    {res.target}
                                </Typography>
                            </Box>
                            <Box
                                display='flex'
                                alignItems='center'
                                gap={1}
                            >
                                <Chip
                                    label={epType}
                                    size='small'
                                    variant='outlined'
                                />
                                {prodUrl && (
                                    <Chip
                                        label={prodUrl}
                                        size='small'
                                        variant='outlined'
                                        color='primary'
                                        sx={{
                                            maxWidth: 300,
                                        }}
                                    />
                                )}
                                {sandUrl && (
                                    <Chip
                                        label={sandUrl}
                                        size='small'
                                        variant='outlined'
                                        color='secondary'
                                        sx={{
                                            maxWidth: 300,
                                        }}
                                    />
                                )}
                                {hasSecurity && (
                                    <Chip
                                        icon={(
                                            <Icon
                                                sx={{
                                                    fontSize:
                                                        16,
                                                }}
                                            >
                                                security
                                            </Icon>
                                        )}
                                        label='Secured'
                                        size='small'
                                        color='success'
                                        variant='outlined'
                                    />
                                )}
                                {certCount > 0 && (
                                    <Chip
                                        icon={(
                                            <Icon
                                                sx={{
                                                    fontSize:
                                                        16,
                                                }}
                                            >
                                                lock
                                            </Icon>
                                        )}
                                        label={
                                            `${certCount}`
                                            + ' cert(s)'
                                        }
                                        size='small'
                                        variant='outlined'
                                    />
                                )}
                            </Box>
                        </Box>
                    );
                })}
            </Paper>
        </Root>
    );
}

ResourceEndpoints.propTypes = {
    api: PropTypes.shape({
        id: PropTypes.string,
    }).isRequired,
    swaggerDef: PropTypes.shape({
        paths: PropTypes.shape({}),
    }).isRequired,
};

export default ResourceEndpoints;
