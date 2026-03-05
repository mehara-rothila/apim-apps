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
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { FormattedMessage } from 'react-intl';
import ConfirmDialog from 'AppComponents/Shared/ConfirmDialog';
import ResourceEndpointCard from './ResourceEndpointCard';

const DEFS_KEY = 'x-wso2-resource-endpoint-definitions';
const REF_KEY = 'x-wso2-resource-endpoint-ref';
const PRIMARY_KEY = 'x-wso2-primary-endpoint-ref';
const HTTP_METHODS = [
    'get', 'post', 'put', 'delete',
    'patch', 'head', 'options',
];

const MSG_PREFIX = 'Apis.Details.Endpoints.ResourceEndpointDefinitions';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
}));

/**
 * Check if a definition has production endpoints.
 *
 * @param {object} def Endpoint definition
 * @returns {boolean} True if production endpoints exist
 */
function hasProductionEndpoint(def) {
    const cfg = def.endpointConfig || def;
    const prod = cfg.production_endpoints;
    if (Array.isArray(prod)) return prod.length > 0;
    return !!prod?.url;
}

/**
 * Check if a definition has sandbox endpoints.
 *
 * @param {object} def Endpoint definition
 * @returns {boolean} True if sandbox endpoints exist
 */
function hasSandboxEndpoint(def) {
    const cfg = def.endpointConfig || def;
    const sand = cfg.sandbox_endpoints;
    if (Array.isArray(sand)) return sand.length > 0;
    return !!sand?.url;
}

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
 * Listing on the Endpoints page for managing
 * resource endpoint definitions. Shows separate
 * Production and Sandbox sections matching the
 * AI Endpoints layout.
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

    const definitions = swaggerDef[DEFS_KEY] || [];
    const primaryId = swaggerDef[PRIMARY_KEY] || null;

    const productionDefs = definitions.filter(hasProductionEndpoint);
    const sandboxDefs = definitions.filter(hasSandboxEndpoint);

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

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <StyledPaper elevation={0} variant='outlined'>
                    <Typography
                        variant='h5'
                        component='h2'
                        gutterBottom
                        sx={{ mb: 3 }}
                    >
                        <FormattedMessage
                            id={MSG_PREFIX + '.production.title'}
                            defaultMessage='Production Endpoints'
                        />
                    </Typography>
                    {productionDefs.length > 0 ? (
                        productionDefs.map((def) => (
                            <ResourceEndpointCard
                                key={def.id}
                                definition={def}
                                displayStage='production'
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
                    ) : (
                        <Typography variant='body1'>
                            <FormattedMessage
                                id={MSG_PREFIX + '.no.production'}
                                defaultMessage={
                                    'No production endpoints configured'
                                }
                            />
                        </Typography>
                    )}
                </StyledPaper>
            </Grid>
            <Grid item xs={12}>
                <StyledPaper elevation={0} variant='outlined'>
                    <Typography
                        variant='h5'
                        component='h2'
                        gutterBottom
                        sx={{ mb: 3 }}
                    >
                        <FormattedMessage
                            id={MSG_PREFIX + '.sandbox.title'}
                            defaultMessage='Sandbox Endpoints'
                        />
                    </Typography>
                    {sandboxDefs.length > 0 ? (
                        sandboxDefs.map((def) => (
                            <ResourceEndpointCard
                                key={def.id}
                                definition={def}
                                displayStage='sandbox'
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
                    ) : (
                        <Typography variant='body1'>
                            <FormattedMessage
                                id={MSG_PREFIX + '.no.sandbox'}
                                defaultMessage={
                                    'No sandbox endpoints configured'
                                }
                            />
                        </Typography>
                    )}
                </StyledPaper>
            </Grid>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                key='confirm-delete-endpoint'
                labelCancel={(
                    <FormattedMessage
                        id={MSG_PREFIX + '.cancelDelete'}
                        defaultMessage='Cancel'
                    />
                )}
                title={(
                    <FormattedMessage
                        id={MSG_PREFIX + '.confirmDelete'}
                        defaultMessage='Delete Endpoint Definition'
                    />
                )}
                message={(
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
                )}
                labelOk={(
                    <FormattedMessage
                        id={MSG_PREFIX + '.delete'}
                        defaultMessage='Delete'
                    />
                )}
                callback={(ok) => {
                    if (ok && selectedDef) {
                        handleDelete();
                    }
                    setConfirmDeleteOpen(false);
                    setSelectedDef(null);
                }}
                open={confirmDeleteOpen}
            />
        </Grid>
    );
}

ResourceEndpointDefinitions.propTypes = {
    swaggerDef: PropTypes.shape({
        paths: PropTypes.shape({}),
    }).isRequired,
    updateSwagger: PropTypes.func.isRequired,
    apiObject: PropTypes.shape({}).isRequired,
};
