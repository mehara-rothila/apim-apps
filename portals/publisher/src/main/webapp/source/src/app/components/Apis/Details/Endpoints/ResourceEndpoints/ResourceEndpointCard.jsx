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
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import { FormattedMessage } from 'react-intl';
import { isRestricted } from 'AppData/AuthManager';
import { useHistory } from 'react-router-dom';
import { getBasePath } from 'AppComponents/Shared/Utils';

const PREFIX = 'ResourceEndpointCard';

const classes = {
    cardContent: `${PREFIX}-cardContent`,
    cardActions: `${PREFIX}-cardActions`,
    endpointInfo: `${PREFIX}-endpointInfo`,
    endpointUrl: `${PREFIX}-endpointUrl`,
    primaryActionButton: `${PREFIX}-primaryActionButton`,
};

const StyledCard = styled(Card)(({ theme }) => ({
    [`& .${classes.cardContent}`]: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing(2),
    },
    [`& .${classes.cardActions}`]: {
        padding: theme.spacing(1),
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
    },
    [`& .${classes.endpointInfo}`]: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(0.5),
    },
    [`& .${classes.endpointUrl}`]: {
        color: theme.palette.text.secondary,
    },
    [`& .${classes.primaryActionButton}`]: {
        width: '140px',
    },
}));

const MSG_PREFIX = 'Apis.Details.Endpoints.ResourceEndpointCard';

/**
 * Get display URLs from a definition.
 *
 * @param {object} definition Endpoint definition
 * @returns {object} { prodUrls: string[], sandUrls: string[] }
 */
function getDisplayUrls(definition) {
    const epType = definition.endpoint_type || 'http';
    let prodUrls = [];
    let sandUrls = [];

    if (epType === 'load_balance') {
        const prodEps = definition.production_endpoints;
        const sandEps = definition.sandbox_endpoints;
        if (Array.isArray(prodEps)) {
            prodUrls = prodEps.map((ep) => ep.url).filter(Boolean);
        } else if (prodEps?.url) {
            prodUrls = [prodEps.url];
        }
        if (Array.isArray(sandEps)) {
            sandUrls = sandEps.map((ep) => ep.url).filter(Boolean);
        } else if (sandEps?.url) {
            sandUrls = [sandEps.url];
        }
    } else if (epType === 'failover') {
        if (definition.production_endpoints?.url) {
            prodUrls = [definition.production_endpoints.url];
        }
        if (definition.production_failovers?.length > 0) {
            prodUrls = prodUrls.concat(
                definition.production_failovers.map((ep) => ep.url).filter(Boolean),
            );
        }
        if (definition.sandbox_endpoints?.url) {
            sandUrls = [definition.sandbox_endpoints.url];
        }
        if (definition.sandbox_failovers?.length > 0) {
            sandUrls = sandUrls.concat(
                definition.sandbox_failovers.map((ep) => ep.url).filter(Boolean),
            );
        }
    } else {
        if (definition.production_endpoints?.url) {
            prodUrls = [definition.production_endpoints.url];
        }
        if (definition.sandbox_endpoints?.url) {
            sandUrls = [definition.sandbox_endpoints.url];
        }
    }
    return { prodUrls, sandUrls };
}

/**
 * Get a readable label for the endpoint type.
 *
 * @param {string} epType Endpoint type
 * @returns {string} Readable label
 */
function getTypeLabel(epType) {
    switch (epType) {
        case 'load_balance': return 'Load Balanced';
        case 'failover': return 'Failover';
        default: return 'HTTP';
    }
}

/**
 * Card component for displaying a single resource endpoint definition.
 *
 * @param {object} props Component props
 * @returns {JSX.Element} Card component
 */
export default function ResourceEndpointCard(props) {
    const {
        definition,
        onDelete,
        isReferenced,
        isPrimary,
        onSetPrimary,
        onRemovePrimary,
        apiObject,
    } = props;

    const history = useHistory();
    const urlPrefix = getBasePath(apiObject.apiType);
    const epType = definition.endpoint_type || 'http';
    const { prodUrls, sandUrls } = getDisplayUrls(definition);
    const restricted = isRestricted(['apim:api_create'], apiObject);

    return (
        <StyledCard
            sx={{ mb: 2, '&:last-child': { mb: 0 } }}
            variant='outlined'
        >
            <CardContent className={classes.cardContent}>
                <div className={classes.endpointInfo}>
                    <Typography variant='subtitle1'>
                        {definition.name}
                        {isPrimary && (
                            <Chip
                                label={(
                                    <FormattedMessage
                                        id={MSG_PREFIX + '.primary'}
                                        defaultMessage='Primary'
                                    />
                                )}
                                size='small'
                                color='primary'
                                sx={{ ml: 1 }}
                            />
                        )}
                        {isReferenced && (
                            <Chip
                                label={(
                                    <FormattedMessage
                                        id={MSG_PREFIX + '.inUse'}
                                        defaultMessage='In Use'
                                    />
                                )}
                                size='small'
                                color='info'
                                sx={{ ml: 1 }}
                            />
                        )}
                        {epType !== 'http' && (
                            <Chip
                                label={getTypeLabel(epType)}
                                size='small'
                                variant='outlined'
                                sx={{ ml: 1 }}
                            />
                        )}
                    </Typography>
                    {prodUrls.length > 0 && (
                        <Typography variant='body2' className={classes.endpointUrl}>
                            <FormattedMessage
                                id={MSG_PREFIX + '.prod'}
                                defaultMessage='Prod:'
                            />
                            {' '}
                            {prodUrls[0]}
                            {prodUrls.length > 1 && (
                                <Chip
                                    label={'+' + (prodUrls.length - 1) + ' more'}
                                    size='small'
                                    variant='outlined'
                                    sx={{ ml: 0.5, height: 18, fontSize: '0.7rem' }}
                                />
                            )}
                        </Typography>
                    )}
                    {sandUrls.length > 0 && (
                        <Typography variant='body2' className={classes.endpointUrl}>
                            <FormattedMessage
                                id={MSG_PREFIX + '.sandbox'}
                                defaultMessage='Sandbox:'
                            />
                            {' '}
                            {sandUrls[0]}
                            {sandUrls.length > 1 && (
                                <Chip
                                    label={'+' + (sandUrls.length - 1) + ' more'}
                                    size='small'
                                    variant='outlined'
                                    sx={{ ml: 0.5, height: 18, fontSize: '0.7rem' }}
                                />
                            )}
                        </Typography>
                    )}
                </div>
                <CardActions className={classes.cardActions}>
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginRight: 'auto',
                    }}
                    >
                        {isPrimary ? (
                            <Button
                                size='small'
                                className={classes.primaryActionButton}
                                onClick={() => onRemovePrimary(definition)}
                                disabled={restricted}
                            >
                                <FormattedMessage
                                    id={MSG_PREFIX + '.removePrimary'}
                                    defaultMessage='Remove Primary'
                                />
                            </Button>
                        ) : (
                            <Button
                                size='small'
                                className={classes.primaryActionButton}
                                onClick={() => onSetPrimary(definition)}
                                disabled={restricted}
                            >
                                <FormattedMessage
                                    id={MSG_PREFIX + '.setPrimary'}
                                    defaultMessage='Set as Primary'
                                />
                            </Button>
                        )}
                    </div>
                    <IconButton
                        size='small'
                        onClick={() => {
                            history.push(
                                urlPrefix + apiObject.id
                                + '/endpoints/' + definition.id,
                            );
                        }}
                        disabled={restricted}
                    >
                        <EditIcon fontSize='small' />
                    </IconButton>
                    <Tooltip
                        title={
                            isReferenced ? (
                                <FormattedMessage
                                    id={MSG_PREFIX + '.deleteBlocked'}
                                    defaultMessage='Remove assignments before deleting'
                                />
                            ) : ''
                        }
                    >
                        <span>
                            <IconButton
                                size='small'
                                color='error'
                                onClick={() => onDelete(definition)}
                                disabled={
                                    isReferenced
                                    || isPrimary
                                    || restricted
                                }
                            >
                                <DeleteIcon fontSize='small' />
                            </IconButton>
                        </span>
                    </Tooltip>
                </CardActions>
            </CardContent>
        </StyledCard>
    );
}

ResourceEndpointCard.defaultProps = {
    isPrimary: false,
    onSetPrimary: () => {},
    onRemovePrimary: () => {},
    apiObject: {},
};

ResourceEndpointCard.propTypes = {
    definition: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        endpoint_type: PropTypes.string,
        production_endpoints: PropTypes.oneOfType([
            PropTypes.shape({ url: PropTypes.string }),
            PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string })),
        ]),
        sandbox_endpoints: PropTypes.oneOfType([
            PropTypes.shape({ url: PropTypes.string }),
            PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string })),
        ]),
        production_failovers: PropTypes.arrayOf(
            PropTypes.shape({ url: PropTypes.string }),
        ),
        sandbox_failovers: PropTypes.arrayOf(
            PropTypes.shape({ url: PropTypes.string }),
        ),
    }).isRequired,
    onDelete: PropTypes.func.isRequired,
    isReferenced: PropTypes.bool.isRequired,
    isPrimary: PropTypes.bool,
    onSetPrimary: PropTypes.func,
    onRemovePrimary: PropTypes.func,
    apiObject: PropTypes.shape({}),
};
