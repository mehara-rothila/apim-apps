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
import ResourceEndpointCard from './ResourceEndpointCard';
import AddEditResourceEndpoint
    from './AddEditResourceEndpoint';

const DEFS_KEY = 'x-wso2-resource-endpoint-definitions';
const REF_KEY = 'x-wso2-resource-endpoint-ref';
const HTTP_METHODS = [
    'get', 'post', 'put', 'delete',
    'patch', 'head', 'options',
];

const MSG_PREFIX = 'Apis.Details.Endpoints'
    + '.ResourceEndpointDefinitions';

/**
 * Generate a unique ID for a definition.
 * @returns {string} Unique ID
 */
function generateId() {
    return 'ep-'
        + Date.now().toString(36)
        + Math.random().toString(36).substr(2, 9);
}

/**
 * Check if a definition is referenced by any
 * operation in the swagger paths.
 * @param {object} paths Swagger paths object
 * @param {string} defId Definition ID
 * @returns {boolean} True if referenced
 */
function isReferenced(paths, defId) {
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
 * Section on the Endpoints page that manages
 * resource endpoint definitions. Users create
 * named endpoint configs here, then assign them
 * to resources via dropdown on the Resources page.
 *
 * @param {object} props Component props
 * @returns {JSX.Element} Definitions section
 */
export default function ResourceEndpointDefinitions(
    props,
) {
    const {
        swaggerDef,
        updateSwagger,
        apiObject,
    } = props;

    const definitions = swaggerDef[DEFS_KEY] || [];

    const [addEditOpen, setAddEditOpen]
        = useState(false);
    const [editingDef, setEditingDef]
        = useState(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen]
        = useState(false);
    const [selectedDef, setSelectedDef]
        = useState(null);

    const handleAdd = (newDef) => {
        const updatedDefs = [
            ...definitions,
            { ...newDef, id: generateId() },
        ];
        updateSwagger({
            ...swaggerDef,
            [DEFS_KEY]: updatedDefs,
        });
        setAddEditOpen(false);
    };

    const handleEdit = (updatedDef) => {
        const updatedDefs = definitions.map(
            (d) => (d.id === updatedDef.id
                ? updatedDef : d),
        );
        updateSwagger({
            ...swaggerDef,
            [DEFS_KEY]: updatedDefs,
        });
        setAddEditOpen(false);
        setEditingDef(null);
    };

    const handleDelete = () => {
        if (!selectedDef) return;
        const updatedDefs = definitions.filter(
            (d) => d.id !== selectedDef.id,
        );
        updateSwagger({
            ...swaggerDef,
            [DEFS_KEY]: updatedDefs,
        });
        setConfirmDeleteOpen(false);
        setSelectedDef(null);
    };

    const openEdit = (def) => {
        setEditingDef(def);
        setAddEditOpen(true);
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
            sx={{ p: 2, mt: 2 }}
        >
            <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
            >
                <Typography
                    variant='h6'
                    component='h3'
                >
                    <FormattedMessage
                        id={MSG_PREFIX + '.title'}
                        defaultMessage={
                            'Resource Endpoint'
                            + ' Definitions'
                        }
                    />
                </Typography>
                <Button
                    variant='outlined'
                    color='primary'
                    size='small'
                    disabled={restricted}
                    onClick={
                        () => setAddEditOpen(true)
                    }
                >
                    <AddCircle
                        sx={{ mr: 0.5 }}
                        fontSize='small'
                    />
                    <FormattedMessage
                        id={
                            MSG_PREFIX
                            + '.addDefinition'
                        }
                        defaultMessage='Add Definition'
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
                        'Create named endpoint'
                        + ' definitions here, then'
                        + ' assign them to individual'
                        + ' resources on the Resources'
                        + ' page.'
                    }
                />
            </Typography>

            {definitions.length > 0
                ? definitions.map((def) => (
                    <ResourceEndpointCard
                        key={def.id}
                        definition={def}
                        onEdit={openEdit}
                        onDelete={openDelete}
                        isReferenced={
                            isReferenced(
                                swaggerDef.paths,
                                def.id,
                            )
                        }
                    />
                ))
                : (
                    <Typography
                        variant='body1'
                        color='textSecondary'
                        sx={{
                            textAlign: 'center',
                            py: 3,
                        }}
                    >
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.empty'
                            }
                            defaultMessage={
                                'No resource endpoint'
                                + ' definitions'
                                + ' configured yet.'
                            }
                        />
                    </Typography>
                )}

            {/* Add/Edit Dialog */}
            <AddEditResourceEndpoint
                open={addEditOpen}
                onClose={() => {
                    setAddEditOpen(false);
                    setEditingDef(null);
                }}
                definition={editingDef}
                existingNames={
                    definitions.map((d) => d.name)
                }
                onSave={
                    editingDef
                        ? handleEdit
                        : handleAdd
                }
            />

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={confirmDeleteOpen}
                onClose={
                    () => setConfirmDeleteOpen(false)
                }
            >
                <DialogTitle>
                    <FormattedMessage
                        id={
                            MSG_PREFIX
                            + '.confirmDelete'
                        }
                        defaultMessage={
                            'Delete Endpoint'
                            + ' Definition'
                        }
                    />
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.deleteMsg'
                            }
                            defaultMessage={
                                'Are you sure you'
                                + ' want to delete'
                                + ' "{name}"?'
                            }
                            values={{
                                name: selectedDef
                                    ?.name || '',
                            }}
                        />
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={
                            () => setConfirmDeleteOpen(
                                false,
                            )
                        }
                    >
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.cancelDelete'
                            }
                            defaultMessage='Cancel'
                        />
                    </Button>
                    <Button
                        variant='contained'
                        color='error'
                        onClick={handleDelete}
                    >
                        <FormattedMessage
                            id={
                                MSG_PREFIX
                                + '.delete'
                            }
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
