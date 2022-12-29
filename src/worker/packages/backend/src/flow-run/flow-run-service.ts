import { apId, CollectionVersion, Cursor, ExecutionOutputStatus, FileId, FlowVersion, Instance, InstanceId, FlowRun, FlowRunId, ProjectId, SeekPage } from "shared";
import { buildPaginator } from "../helper/pagination/build-paginator";
import { paginationHelper } from "../helper/pagination/pagination-utils";
import { Order } from "../helper/pagination/paginator";
import { FlowRunEntity } from "./flow-run-entity";
import { flowRunRepo as repo } from "./flow-run-repo";

export const flowRunService = {
    async list({ projectId, cursor, limit }: ListParams): Promise<SeekPage<FlowRun>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor);

        const paginator = buildPaginator({
            entity: FlowRunEntity,
            paginationKeys: ["created"],
            query: {
                limit: limit,
                order: Order.DESC,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor
            },
        });

        const query = repo.createQueryBuilder("flow_run").where({
            projectId,
        });

        const { data, cursor: newCursor } = await paginator.paginate(query);

        return paginationHelper.createPage<FlowRun>(data, newCursor);
    },
    async finish(flowRunId: FlowRunId, status: ExecutionOutputStatus, logsFileId: FileId): Promise<FlowRun | null>{
        await repo.update(flowRunId, {
            logsFileId: logsFileId,
            status: status,
            finishTime: (new Date()).toISOString()
        })
        return this.getOne({id: flowRunId});
    },
    async start(runId: FlowRunId, instanceId: InstanceId | null, projectId: ProjectId, flowVersion: FlowVersion, collectionVerson: CollectionVersion): Promise<FlowRun> {
        let flowRun: Partial<FlowRun> = {
            id: runId,
            instanceId: instanceId,
            projectId: projectId,
            collectionId: collectionVerson.collectionId,
            flowVersionId: flowVersion.id,
            collectionVersionId: collectionVerson.id,
            flowDisplayName: flowVersion.displayName,
            collectionDisplayName: collectionVerson.displayName,
            status: ExecutionOutputStatus.RUNNING,
            startTime: (new Date()).toISOString()
        };
        return repo.save( flowRun);
    },
    async getOne({ id }: GetOneParams): Promise<FlowRun | null> {
        return repo.findOneBy({
            id,
        });
    },
};

type ListParams = {
    projectId: ProjectId,
    cursor: Cursor | null,
    limit: number,
};

type GetOneParams = {
    id: FlowRunId,
};