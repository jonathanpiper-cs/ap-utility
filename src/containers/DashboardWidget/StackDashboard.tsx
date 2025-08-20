import { useState, useEffect, useRef, useContext } from "react"
import { InfiniteScrollTable, Icon } from "@contentstack/venus-components"
import '@contentstack/venus-components/build/main.css'
import { useAppSdk } from "../../common/hooks/useAppSdk"
import "../index.css"
import "./StackDashboard.css"
import { MarketplaceAppContext } from "../../common/contexts/marketplaceContext"

type ContentTypesResponse = { content_types?: any[] }

const StackDashboardExtension = () => {
    const hi = useContext(MarketplaceAppContext)
    console.log(hi)
    const columns = [
        { Header: 'Content Type', accessor: 'title' },
        {
            Header: 'Entries', accessor: (data: { count: number, uid: string }) => {
                // return (<Pill items={[{ id: 1, text: data.count, trailingIcon: data.count !== 0 ? <Icon icon="InternalLink" /> : undefined }]} status={data.count === 0 ? 'danger' : 'default'} onPillClickHandler={() => openEntriesView(stack?._data.api_key || '', data.uid || '', data.count || 0)} shouldHaveBorder={false} variant='chip' />)
                return (data.count > 0 ?<a href={`https://app.contentstack.com/#!/stack/${stack?._data.api_key}/entries?branch=main&page=1&page_size=100&popular_view=entries-only-base&query={"queryObject":{"$and":[{"_variants":{"$in":["$baseVariant"]}}],"_content_type_uid":{"$in":["${data.uid}"]}}}`}>{data.count} - View <Icon icon="InternalLink"></Icon></a> : <>{data.count}</>)
            }
        },
        {
            Header: 'Content Type Builder', accessor: (data: { uid: any }) => {
                return (<a href={`https://app.contentstack.com/#/stack/${stack?._data.api_key}/content-type/${data.uid}/content-type-builder?branch=main`} target="_blank">Open <Icon icon="InternalLink"></Icon></a>)
            }
        },
    ]

    const appSdk = useAppSdk()
    const stack = appSdk?.stack

    const [contentTypes, setContentTypes] = useState<any[]>([])
    const [itemStatusMap, setItemStatusMap] = useState<string[]>([])
    const tableRef = useRef<HTMLDivElement | null>(null)

    const fetchData = async () => {
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
                console.log('hi')
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
                console.log("Content Types with Count:", contentTypesWithCount)
                setContentTypes(contentTypesWithCount.content_types ?? [])
            }
        } catch (error) {
            console.log('fetchData -> error', error)
        }
    }

    useEffect(() => {
        fetchData()
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
                    // initialSortByV2={sortByV2}
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
