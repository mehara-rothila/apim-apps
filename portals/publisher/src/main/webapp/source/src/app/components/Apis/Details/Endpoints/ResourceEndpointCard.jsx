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
import Typography from '@mui/material/Typography';
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

const PREFIX = 'ResourceEndpointCard';

const classes = {
    cardContent: `${PREFIX}-cardContent`,
    cardActions: `${PREFIX}-cardActions`,
    endpointInfo: `${PREFIX}-endpointInfo`,
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
}));

const MSG_PREFIX = 'Apis.Details.Endpoints'
    + '.ResourceEndpointCard';

/**
 * Card component for displaying a single resource
 * endpoint definition in the Endpoints page.
 *
 * @param {object} props Component props
 * @returns {JSX.Element} Card component
 */
export default function ResourceEndpointCard(props) {
    const {
        definition,
        onEdit,
        onDelete,
        isReferenced,
    } = props;

    const prodUrl = definition
        .production_endpoints?.url;
    const sandUrl = definition
        .sandbox_endpoints?.url;

    return (
        <StyledCard
            sx={{
                mb: 2,
                '&:last-child': { mb: 0 },
            }}
            variant='outlined'
        >
            <CardContent
                className={classes.cardContent}
            >
                <div className={classes.endpointInfo}>
                    <Typography variant='subtitle1'>
                        {definition.name}
                        {isReferenced && (
                            <Chip
                                label={(
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.inUse'
                                        }
                                        defaultMessage='In Use'
                                    />
                                )}
                                size='small'
                                color='info'
                                sx={{ ml: 1 }}
                            />
                        )}
                    </Typography>
                    {prodUrl && (
                        <Typography
                            variant='body2'
                            color='textSecondary'
                        >
                            <FormattedMessage
                                id={
                                    MSG_PREFIX
                                    + '.prod'
                                }
                                defaultMessage='Prod:'
                            />
                            {' '}
                            {prodUrl}
                        </Typography>
                    )}
                    {sandUrl && (
                        <Typography
                            variant='body2'
                            color='textSecondary'
                        >
                            <FormattedMessage
                                id={
                                    MSG_PREFIX
                                    + '.sandbox'
                                }
                                defaultMessage='Sandbox:'
                            />
                            {' '}
                            {sandUrl}
                        </Typography>
                    )}
                </div>
                <CardActions
                    className={classes.cardActions}
                >
                    <IconButton
                        size='small'
                        onClick={
                            () => onEdit(definition)
                        }
                    >
                        <EditIcon fontSize='small' />
                    </IconButton>
                    <Tooltip
                        title={
                            isReferenced
                                ? (
                                    <FormattedMessage
                                        id={
                                            MSG_PREFIX
                                            + '.deleteBlocked'
                                        }
                                        defaultMessage={
                                            'Remove'
                                            + ' assignments'
                                            + ' before'
                                            + ' deleting'
                                        }
                                    />
                                )
                                : ''
                        }
                    >
                        <span>
                            <IconButton
                                size='small'
                                color='error'
                                onClick={
                                    () => onDelete(
                                        definition,
                                    )
                                }
                                disabled={isReferenced}
                            >
                                <DeleteIcon
                                    fontSize='small'
                                />
                            </IconButton>
                        </span>
                    </Tooltip>
                </CardActions>
            </CardContent>
        </StyledCard>
    );
}

ResourceEndpointCard.propTypes = {
    definition: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        production_endpoints: PropTypes.shape({
            url: PropTypes.string,
        }),
        sandbox_endpoints: PropTypes.shape({
            url: PropTypes.string,
        }),
    }).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    isReferenced: PropTypes.bool.isRequired,
};
