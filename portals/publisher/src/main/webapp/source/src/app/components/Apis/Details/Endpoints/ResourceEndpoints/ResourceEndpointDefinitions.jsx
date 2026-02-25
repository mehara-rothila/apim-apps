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

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddCircle from '@mui/icons-material/AddCircle';
import { FormattedMessage } from 'react-intl';
import { isRestricted } from 'AppData/AuthManager';
import { useHistory } from 'react-router-dom';
import { getBasePath } from 'AppComponents/Shared/Utils';
import ResourceEndpointCard from './ResourceEndpointCard';

const DEFS_KEY = 'x-wso2-resource-endpoint-definitions';
const REF_KEY = 'x-wso2-resource-endpoint-ref';
const PRIMARY_KEY = 'x-wso2-primary-endpoint-ref';
const HTTP_METHODS = [
    'get', 'post', 'put', 'delete',
    'patch', 'head', 'options',
];

const MSG_PREFIX = 'Apis.Details.Endpoints.ResourceEndpointDefinitions';

/**
 * Check if a definition is referenced by any
 * operation in the swagger paths.
 *
 * @param {object} paths Swagger paths object
 * @param {string} defId Definition ID
 * @returns {boolean} True if referenced
 */
function isDefinitionReferenced(paths, defId) {
    if (!paths) return false;
    const entries = Object.entries(paths);
    for (let i = 0; i < entries.length; i++) {
        const verbObj = entries[i][1];
        const verbs = Object.entries(verbObj);
        for (let j = 0; j < verbs.length; j++) {
            const [verb, operation] = verbs[j];
            if (
                HTTP_METHODS.includes(verb)
                && operation
                && operation[REF_KEY] === defId
            ) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Card listing on the Endpoints page for managing
 * resource endpoint definitions. "Add New Endpoint"
 * navigates to the create page; edit navigates to
 * the edit page.
 *
 * @param {object} props Component props
 * @returns {JSX.Element} Definitions listing
 */
export default function ResourceEndpointDefinitions(props) {
    const {
        swaggerDef,
        updateSwagger,
        apiObject,
    } = props;

    const history = useHistory();
    const urlPrefix = getBasePath(apiObject.apiType);

    const definitions = swaggerDef[DEFS_KEY] || [];
    const primaryId = swaggerDef[PRIMARY_KEY] || null;

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [selectedDef, setSelectedDef] = useState(null);

    const handleDelete = () => {
        if (!selectedDef) return;
        const updatedDefs = definitions.filter(
            (d) => d.id !== selectedDef.id,
        );
        const updatedSwagger = {
            ...swaggerDef,
            [DEFS_KEY]: updatedDefs,
        };
        if (primaryId === selectedDef.id && updatedDefs.length > 0) {
            updatedSwagger[PRIMARY_KEY] = updatedDefs[0].id;
        } else if (updatedDefs.length === 0) {
            delete updatedSwagger[PRIMARY_KEY];
        }
        updateSwagger(updatedSwagger);
        setConfirmDeleteOpen(false);
        setSelectedDef(null);
    };

    const handleSetPrimary = (def) => {
        updateSwagger({
            ...swaggerDef,
            [PRIMARY_KEY]: def.id,
        });
    };

    const handleRemovePrimary = () => {
        const updatedSwagger = { ...swaggerDef };
        delete updatedSwagger[PRIMARY_KEY];
        updateSwagger(updatedSwagger);
    };

    const openDelete = (def) => {
        setSelectedDef(def);
        setConfirmDeleteOpen(true);
    };

    const restricted = isRestricted(
        ['apim:api_create'], apiObject,
    );

    return (
        <Paper
            elevation={0}
            variant='outlined'
            sx={{ p: 2, mb: 2 }}
        >
            <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
            >
                <Typography variant='h6' component='h3'>
                    <FormattedMessage
                        id={MSG_PREFIX + '.title'}
                        defaultMessage='Resource Endpoint Definitions'
                    />
                </Typography>
                <Button
                    variant='outlined'
                    color='primary'
                    size='small'
                    disabled={restricted}
                    onClick={() => {
                        history.push(
                            urlPrefix + apiObject.id
                            + '/endpoints/create',
                        );
                    }}
                >
                    <AddCircle sx={{ mr: 0.5 }} fontSize='small' />
                    <FormattedMessage
                        id={MSG_PREFIX + '.addEndpoint'}
                        defaultMessage='Add New Endpoint'
                    />
                </Button>
            </Box>

            <Typography
                variant='body2'
                color='textSecondary'
                sx={{ mb: 2 }}
            >
                <FormattedMessage
                    id={MSG_PREFIX + '.description'}
                    defaultMessage={
                        'Create endpoint definitions here, then assign them'
                        + ' to individual API resources on the Resources page.'
                    }
                />
            </Typography>

            {definitions.length > 0
                ? definitions.map((def) => (
                    <ResourceEndpointCard
                        key={def.id}
                        definition={def}
                        onDelete={openDelete}
                        isReferenced={
                            isDefinitionReferenced(
                                swaggerDef.paths, def.id,
                            )
                        }
                        isPrimary={primaryId === def.id}
                        onSetPrimary={handleSetPrimary}
                        onRemovePrimary={handleRemovePrimary}
                        apiObject={apiObject}
                    />
                ))
                : (
                    <Typography
                        variant='body1'
                        color='textSecondary'
                        sx={{ textAlign: 'center', py: 3 }}
                    >
                        <FormattedMessage
                            id={MSG_PREFIX + '.empty'}
                            defaultMessage='No endpoint definitions configured yet.'
                        />
                    </Typography>
                )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={confirmDeleteOpen}
                onClose={() => setConfirmDeleteOpen(false)}
            >
                <DialogTitle>
                    <FormattedMessage
                        id={MSG_PREFIX + '.confirmDelete'}
                        defaultMessage='Delete Endpoint Definition'
                    />
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        <FormattedMessage
                            id={MSG_PREFIX + '.deleteMsg'}
                            defaultMessage={
                                'Are you sure you want to delete'
                                + ' "{name}"?'
                            }
                            values={{
                                name: selectedDef?.name || '',
                            }}
                        />
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setConfirmDeleteOpen(false)}
                    >
                        <FormattedMessage
                            id={MSG_PREFIX + '.cancelDelete'}
                            defaultMessage='Cancel'
                        />
                    </Button>
                    <Button
                        variant='contained'
                        color='error'
                        onClick={handleDelete}
                    >
                        <FormattedMessage
                            id={MSG_PREFIX + '.delete'}
                            defaultMessage='Delete'
                        />
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}

ResourceEndpointDefinitions.propTypes = {
    swaggerDef: PropTypes.shape({
        paths: PropTypes.shape({}),
    }).isRequired,
    updateSwagger: PropTypes.func.isRequired,
    apiObject: PropTypes.shape({}).isRequired,
};
