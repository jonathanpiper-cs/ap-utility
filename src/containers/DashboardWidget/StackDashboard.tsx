import { useState, useEffect, useRef } from "react"
import { InfiniteScrollTable, Icon } from "@contentstack/venus-components"
import '@contentstack/venus-components/build/main.css'
import { useAppSdk } from "../../common/hooks/useAppSdk"
import "../index.css"
import "./StackDashboard.css"

type ContentTypesResponse = { content_types?: any[] }

const StackDashboardExtension = () => {
    const columns = [
        { Header: 'Content Type', accessor: 'title' },
        {
            Header: 'Entries', accessor: (data: { count: number, uid: string }) => {
                return (data.count > 0 ? <a href={`https://app.contentstack.com/#!/stack/${stack?._data.api_key}/entries?branch=main&page=1&page_size=100&popular_view=entries-only-base&query={"queryObject":{"$and":[{"_variants":{"$in":["$baseVariant"]}}],"_content_type_uid":{"$in":["${data.uid}"]}}}`}>{data.count} - View <Icon icon="InternalLink"></Icon></a> : <>{data.count}</>)
            },
            id: 'count'
        },
        {
            Header: 'Content Type Builder', accessor: (data: { uid: any }) => {
                return (<a href={`https://app.contentstack.com/#/stack/${stack?._data.api_key}/content-type/${data.uid}/content-type-builder?branch=main`} target="_blank">Open <Icon icon="InternalLink"></Icon></a>)
            }, disabledSortBy: true
        },
    ]

    const appSdk = useAppSdk()
    const stack = appSdk?.stack

    const [contentTypes, setContentTypes] = useState<any[]>([])
    const [itemStatusMap, setItemStatusMap] = useState<string[]>([])
    const [sortByV2, setSortByV2]: any = useState({
        sortingDirection: 'asc',
        id: 'title'
    })
    const tableRef = useRef<HTMLDivElement | null>(null)

    const fetchData = async ({ sortBy, searchText, skip, limit, startIndex, stopIndex, fetchCalledByTable }: any) => {
        console.log(sortBy, searchText, skip, limit, startIndex, stopIndex, fetchCalledByTable)
        try {
            let itemStatusMapCopy = { ...itemStatusMap }

            let contentTypesObj: ContentTypesResponse = {}
            let contentTypesWithCount: ContentTypesResponse = {}
            if (stack && typeof stack.getContentTypes === "function") {
                contentTypesObj = await stack.getContentTypes()
                setContentTypes(contentTypesObj.content_types ?? [])
                if (contentTypesObj.content_types) {
                    for (let index = 0; index < contentTypesObj.content_types.length; index++) {
                        itemStatusMapCopy[index] = 'loading'
                    }
                }
                setItemStatusMap(itemStatusMapCopy)
            }
            if (stack && contentTypesObj.content_types) {
                contentTypesWithCount.content_types = await Promise.all(contentTypesObj.content_types.map(async (contentType) => {
                    const count = await stack.ContentType(contentType.uid).Entry.Query().count()
                    return { ...contentType, count: count.entries }
                }))
                if (contentTypesObj.content_types) {
                    for (let index = 0; index < contentTypesObj.content_types.length; index++) {
                        itemStatusMapCopy[index] = 'loaded'
                    }
                }
                setItemStatusMap(itemStatusMapCopy)
                if (contentTypesWithCount?.content_types) {
                    contentTypesWithCount.content_types.sort((a: any, b: any) => {
                        if (sortBy.id === 'title') {
                            return a[sortBy.id].localeCompare(b[sortBy.id]) * (sortBy?.sortingDirection === 'asc' ? 1 : -1)
                        } else {
                            console.log('a', a[sortBy.id], 'b', b[sortBy.id], a[sortBy.id] - b[sortBy.id], (sortBy?.sortingDirection === 'asc' ? 1 : -1))
                            console.log(a[sortBy.id] - b[sortBy.id] * (sortBy?.sortingDirection === 'asc' ? 1 : -1))
                            return (a[sortBy.id] - b[sortBy.id]) * (sortBy?.sortingDirection === 'asc' ? 1 : -1)
                        }
                        return 0
                    })
                }
                setContentTypes(contentTypesWithCount.content_types ?? [])
            }
        } catch (error) {
            console.log('fetchData -> error', error)
        }
    }

    useEffect(() => {
        fetchData({ sortBy: sortByV2, searchText: '', skip: 0, limit: 100, startIndex: 0, stopIndex: 100, fetchCalledByTable: false })
    }, [])

    return (
        <div className="layout-container">
            <div className="ui-location">
                {contentTypes.length > 0 ?
                    <InfiniteScrollTable data={contentTypes}
                        columns={columns}
                        uniqueKey={'uid'}
                        fetchTableData={fetchData}
                        // loading={loading}
                        // totalCounts={totalCounts}
                        loadMoreItems={fetchData}
                        itemStatusMap={itemStatusMap}
                        columnSelector={true}
                        minBatchSizeToFetch={50}
                        viewSelector={true}
                        // getViewByValue={getViewByValue}
                        initialSortBy={[{ id: 'title', desc: false }]}
                        searchPlaceholder={'Search'}
                        // canSearch={true}
                        canRefresh={true}
                        ref={tableRef}
                        initialSortByV2={sortByV2}
                    // callBackForSortByV2={(sortBy) => {
                    //     console.log('sorting here callback', sortBy)
                    //     setSortByV2(sortBy)
                    //     fetchData({ sortBy, skip: 0, limit: 30 })

                    /> : <></>}
            </div>
        </div>
    )
}
export default StackDashboardExtension
